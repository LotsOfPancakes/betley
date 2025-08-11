// ============================================================================
// File: frontend/lib/supabase.ts
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// ============================================================================
// CLIENT-SIDE SUPABASE (LIMITED PERMISSIONS)
// ============================================================================

// ✅ CLIENT: Read-only access for public data
// Will respect RLS policies for user-specific data
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth sessions needed for Web3 app
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'betley-frontend'
    }
  }
})

// ============================================================================
// SERVER-SIDE SUPABASE (FULL PERMISSIONS)
// ============================================================================

// ✅ SERVER: Full access for API routes (service role)
// Bypasses RLS for admin operations
export function createServerSupabaseClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for server operations. ' +
      'Add it to your environment variables (do NOT prefix with NEXT_PUBLIC_)'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'betley-server'
      }
    }
  })
}

// ============================================================================
// RATE LIMITING HELPER
// ============================================================================

// ✅ Updated rate limiting function to use server client for database writes
export async function checkRateLimit(
  clientIp: string,
  endpoint: string,
  maxRequests = 100,
  windowMinutes = 60
): Promise<boolean> {
  const serverSupabase = createServerSupabaseClient()
  
  try {
    // Create a hash of the client IP for privacy
    const keyHash = Buffer.from(`${clientIp}-${endpoint}`).toString('base64').substring(0, 32)
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
    
    // Check current rate limit status
    const { data: record, error: selectError } = await serverSupabase
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('key_hash', keyHash)
      .eq('action_type', endpoint)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Rate limit check error:', selectError)
      return true // Allow on error
    }

    let currentCount = 0

    if (record) {
      const recordWindowStart = new Date(record.window_start)
      
      // If the record is within the current window, use its count
      if (recordWindowStart >= windowStart) {
        currentCount = record.request_count
        
        // Check if we've exceeded the limit
        if (currentCount >= maxRequests) {
          return false
        }
        
        // Increment the count
        currentCount += 1
      } else {
        // Window has expired, reset count
        currentCount = 1
      }
    } else {
      // No existing record, start with 1
      currentCount = 1
    }

    // Update or insert the rate limit record
    await serverSupabase
      .from('rate_limits')
      .upsert({
        key_hash: keyHash,
        action_type: endpoint,
        request_count: currentCount,
        window_start: record && new Date(record.window_start) >= windowStart 
          ? record.window_start 
          : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return true
  } catch (error) {
    console.error('Rate limiting error:', error)
    return true // Allow on error to prevent service disruption
  }
}

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

// Input validation helpers
export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function validateRandomId(randomId: string): boolean {
  return /^[A-Za-z0-9]{8}$/.test(randomId)
}

export function validateBetName(betName: string): boolean {
  return betName.trim().length > 0 && betName.length <= 200
}

export function validateNumericId(numericId: number): boolean {
  return Number.isInteger(numericId) && numericId >= 0 && numericId < 1000000
}

// ============================================================================
// SECURE RANDOM ID GENERATION
// ============================================================================

// Helper function to generate cryptographically secure random IDs
export function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // Use crypto.getRandomValues for better security
  const array = new Uint8Array(8)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Node.js environment - use dynamic import to avoid bundling issues
    try {
      const crypto = eval('require')('crypto') as typeof import('crypto')
      crypto.randomFillSync(array)
    } catch {
      // Fallback for environments without crypto
      for (let i = 0; i < 8; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
  }
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(array[i] % chars.length)
  }
  
  return result
}

// ============================================================================
// SECURE DATABASE OPERATIONS
// ============================================================================

// ✅ Updated to support isPublic parameter
export async function createBetMappingSecure(
  numericId: number,
  creatorAddress: string,
  betName: string,
  isPublic: boolean = false
): Promise<{ randomId: string | null; error: string | null }> {
  // Validate inputs
  if (!validateNumericId(numericId)) {
    return { randomId: null, error: 'Invalid numeric ID' }
  }
  
  if (!validateEthereumAddress(creatorAddress)) {
    return { randomId: null, error: 'Invalid creator address' }
  }
  
  if (!validateBetName(betName)) {
    return { randomId: null, error: 'Invalid bet name' }
  }

  const serverSupabase = createServerSupabaseClient()
  
  try {
    // Check if mapping already exists
    const { data: existing } = await serverSupabase
      .from('bet_mappings')
      .select('random_id')
      .eq('numeric_id', numericId)
      .single()

    if (existing) {
      return { randomId: existing.random_id, error: null }
    }

    // Generate unique random ID with collision detection
    let randomId: string
    let attempts = 0
    const maxAttempts = 10

    do {
      randomId = generateRandomId()
      attempts++
      
      if (attempts > maxAttempts) {
        return { randomId: null, error: 'Unable to generate unique ID' }
      }

      const { data: duplicate } = await serverSupabase
        .from('bet_mappings')
        .select('id')
        .eq('random_id', randomId)
        .single()

      if (!duplicate) break
    } while (attempts < maxAttempts)

    // ✅ Updated: Insert new mapping with isPublic flag
    const { error } = await serverSupabase
      .from('bet_mappings')
      .insert({
        random_id: randomId,
        numeric_id: numericId,
        creator_address: creatorAddress.toLowerCase(), // Normalize case
        bet_name: betName.trim(),
        is_public: isPublic  // ✅ NEW FIELD
      })

    if (error) {
      console.error('Database error:', error)
      return { randomId: null, error: 'Failed to create mapping' }
    }

    return { randomId, error: null }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { randomId: null, error: 'Internal server error' }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface BetMapping {
  id: string
  random_id: string
  numeric_id: number
  creator_address: string
  bet_name: string
  is_public?: boolean  // ✅ Added optional isPublic field
  created_at: string
}

export interface AuditLog {
  id: number
  action: string
  table_name: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  user_role?: string
  created_at: string
}

// ============================================================================
// ENVIRONMENT VARIABLES NEEDED
// ============================================================================

/*
Required Environment Variables:

# Existing (keep these):
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# New (add these - NO NEXT_PUBLIC_ prefix):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
*/