// ============================================================================
// File: frontend/app/api/bets/create/route.ts
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

    const { numericId, creatorAddress, betName, isPublic = false } = body

    console.log('Create bet request:', { numericId, creatorAddress, betName, isPublic })

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

    // ✅ VALIDATION: Validate isPublic parameter
    if (typeof isPublic !== 'boolean') {
      return Response.json({ error: 'Invalid public flag' }, { status: 400 })
    }

    // ✅ RLS FIX: Use server Supabase client with full permissions
    const supabase = createServerSupabaseClient()

    console.log('Using server Supabase client')

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
      console.log('Existing mapping found:', existing.random_id)
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

    console.log('Generated random ID:', randomId, 'after', attempts, 'attempts')

    // ✅ COMPLETE: Insert new mapping with isPublic flag
    const insertData = {
      random_id: randomId,
      numeric_id: numericId,
      creator_address: creatorAddress.toLowerCase(), // Normalize case
      bet_name: betName.trim(),
      is_public: isPublic  // ✅ PRESERVED: isPublic field support
    }

    console.log('Inserting data:', insertData)

    const { data: insertResult, error: insertError } = await supabase
      .from('bet_mappings')
      .insert(insertData)
      .select() // Return the inserted data

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

    console.log('Successfully inserted:', insertResult)

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