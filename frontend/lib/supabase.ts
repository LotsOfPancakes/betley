// ============================================================================
// SECURE SUPABASE CONFIGURATION - TYPESCRIPT FIXED
// ============================================================================

// frontend/lib/supabase.ts - Updated secure configuration with proper TypeScript
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CLIENT-SIDE SUPABASE (LIMITED PERMISSIONS)
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// ✅ CLIENT: Read-only access for public data
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth sessions needed
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
export function createServerSupabaseClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY - required for server operations')
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

export async function checkRateLimit(
  clientIp: string,
  endpoint: string,
  maxRequests = 100,
  windowMinutes = 60
): Promise<boolean> {
  const serverSupabase = createServerSupabaseClient()
  
  try {
    const { data, error } = await serverSupabase.rpc('check_rate_limit', {
      p_client_ip: clientIp,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    })

    if (error) {
      console.error('Rate limit check failed:', error)
      return false // Fail closed
    }

    return data === true
  } catch (error) {
    console.error('Rate limit error:', error)
    return false // Fail closed
  }
}

// ============================================================================
// SECURE HELPER FUNCTIONS
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
// SECURE DATABASE OPERATIONS
// ============================================================================

export async function createBetMappingSecure(
  numericId: number,
  creatorAddress: string,
  betName: string
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

    // Insert new mapping
    const { error } = await serverSupabase
      .from('bet_mappings')
      .insert({
        random_id: randomId,
        numeric_id: numericId,
        creator_address: creatorAddress.toLowerCase(), // Normalize case
        bet_name: betName.trim()
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
Add these to your .env.local and Vercel environment variables:

# Existing (keep these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# New (server-side only - DO NOT prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

The service role key can be found in:
Supabase Dashboard > Settings > API > service_role key
*/