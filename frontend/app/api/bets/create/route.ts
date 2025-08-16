// ============================================================================
// File: frontend/app/api/bets/create/route.ts
// New Privacy-Focused Bet Creation API
// Purpose: Store sensitive bet data in database after contract creation
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, generateRandomId, checkRateLimit } from '@/lib/supabase'
import { trackBetCreation } from '@/lib/analytics/activityTracker'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Get client IP for rate limiting
    const clientIp = getClientIP(request)

    // ✅ SECURITY: Check rate limit (20 requests per hour for bet creation)
    const rateLimitOk = await checkRateLimit(clientIp, 'create-bet', 20, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    // ✅ SECURITY: Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return Response.json(
        { error: 'Invalid content type' }, 
        { status: 400 }
      )
    }

    // ✅ Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON payload' }, 
        { status: 400 }
      )
    }

    const { 
      numericId, 
      creatorAddress, 
      betName, 
      betOptions = [],
      tokenAddress,
      durationInSeconds = 0,
      isPublic = false,
      whitelistedAddresses = []
    } = body



    // ✅ VALIDATION: Check all inputs
    if (typeof numericId !== 'number' || numericId < 0) {
      return Response.json({ error: 'Invalid numeric ID' }, { status: 400 })
    }

    if (!creatorAddress || !creatorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return Response.json({ error: 'Invalid creator address' }, { status: 400 })
    }

    if (!betName || typeof betName !== 'string' || betName.trim().length === 0) {
      return Response.json({ error: 'Invalid bet name' }, { status: 400 })
    }

    if (betName.length > 200) {
      return Response.json({ error: 'Bet name too long' }, { status: 400 })
    }

    // ✅ VALIDATION: Validate bet options (required for new architecture)
    if (!Array.isArray(betOptions) || betOptions.length < 2 || betOptions.length > 4) {
      return Response.json({ error: 'Invalid bet options - need 2-4 options' }, { status: 400 })
    }

    // ✅ VALIDATION: Validate each option
    for (const option of betOptions) {
      if (!option || typeof option !== 'string' || option.trim().length === 0) {
        return Response.json({ error: 'All bet options must be non-empty strings' }, { status: 400 })
      }
      if (option.length > 100) {
        return Response.json({ error: 'Bet options too long (max 100 characters)' }, { status: 400 })
      }
    }

    // ✅ VALIDATION: Validate token address
    if (!tokenAddress || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return Response.json({ error: 'Invalid token address' }, { status: 400 })
    }

    // ✅ VALIDATION: Validate duration (required)
    if (typeof durationInSeconds !== 'number' || durationInSeconds <= 0) {
      return Response.json({ error: 'Invalid duration' }, { status: 400 })
    }

    // ✅ VALIDATION: Validate isPublic flag
    if (typeof isPublic !== 'boolean') {
      return Response.json({ error: 'Invalid isPublic flag' }, { status: 400 })
    }

    // ✅ VALIDATION: Validate whitelist addresses (optional)
    if (!Array.isArray(whitelistedAddresses)) {
      return Response.json({ error: 'Invalid whitelist addresses' }, { status: 400 })
    }
    
    for (const addr of whitelistedAddresses) {
      if (!addr || typeof addr !== 'string' || !addr.match(/^0x[a-fA-F0-9]{40}$/)) {
        return Response.json({ error: 'Invalid whitelist address format' }, { status: 400 })
      }
    }

    // ✅ RLS FIX: Use server Supabase client with full permissions
    const supabase = createServerSupabaseClient()



    // Check if mapping already exists for this numeric ID
    const { data: existing, error: lookupError } = await supabase
      .from('bet_mappings')
      .select('random_id')
      .eq('numeric_id', numericId)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Lookup error:', lookupError)
      return Response.json({ error: 'Database lookup failed' }, { status: 500 })
    }

    if (existing) {

      return Response.json({ randomId: existing.random_id })
    }

    // Generate unique random ID with collision detection
    let randomId: string
    let attempts = 0
    const maxAttempts = 10

    do {
      randomId = generateRandomId()
      attempts++
      
      if (attempts > maxAttempts) {
        console.error('Unable to generate unique ID after', maxAttempts, 'attempts')
        return Response.json({ error: 'Unable to generate unique ID' }, { status: 500 })
      }

      const { data: duplicate, error: duplicateError } = await supabase
        .from('bet_mappings')
        .select('id')
        .eq('random_id', randomId)
        .single()

      if (duplicateError && duplicateError.code !== 'PGRST116') {
        console.error('Duplicate check error:', duplicateError)
        return Response.json({ error: 'Database error during ID generation' }, { status: 500 })
      }

      if (!duplicate) break
    } while (attempts < maxAttempts)



    // ✅ NEW ARCHITECTURE: Store ALL sensitive bet details in database
    const endTime = Math.floor(Date.now() / 1000) + durationInSeconds
    const insertData = {
      random_id: randomId,
      numeric_id: numericId,
      
      // Sensitive data (stored here, NOT on blockchain)
      bet_name: betName.trim(),
      bet_options: betOptions, // Full option text stored here
      
      // Creator and configuration
      creator_address: creatorAddress.toLowerCase(),
      option_count: betOptions.length,
      token_address: tokenAddress.toLowerCase(),
      
      // Timing
      end_time: endTime,
      
      // Visibility
      is_public: isPublic,
      
      // Whitelist (for convenience - contract is source of truth)
      has_whitelist: whitelistedAddresses.length > 0,
      
      // Initial state (will be updated by sync process)
      resolved: false,
      winning_option: null,
      total_amounts: new Array(betOptions.length).fill(0), // Initialize with zeros
      resolution_deadline: endTime + (24 * 60 * 60), // 24 hours after end time
    }



    const { data: insertedBet, error: insertError } = await supabase
      .from('bet_mappings')
      .insert(insertData)
      .select('id') // Return the inserted data with ID

    if (insertError) {
      console.error('Insert error:', insertError)
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return Response.json({ error: 'Failed to create mapping' }, { status: 500 })
    }

    // ✅ OPTIONAL: Store whitelist addresses for convenience
    if (whitelistedAddresses.length > 0 && insertedBet?.[0]?.id) {
      const betId = insertedBet[0].id
      const whitelistData = whitelistedAddresses.map(addr => ({
        bet_id: betId,
        participant_address: addr.toLowerCase(),
        added_by: creatorAddress.toLowerCase()
      }))

      const { error: whitelistError } = await supabase
        .from('bet_whitelist')
        .insert(whitelistData)

      if (whitelistError) {
        // Don't fail the whole request for whitelist storage errors
        console.warn('Failed to store whitelist addresses:', whitelistError)
      }
    }



    // ✅ REAL-TIME ANALYTICS: Track bet creation activity
    await trackBetCreation(creatorAddress, numericId)

    // ✅ SECURITY: Return minimal response
    return Response.json({ randomId }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    
    // ✅ SECURITY: Don't leak internal error details
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}