// ============================================================================
// File: frontend/app/api/bets/user-bets/route.ts
// Database-first user bets query API (Phase 2)
// Purpose: Eliminate RPC rate limiting by querying database first
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, checkRateLimit } from '@/lib/supabase'
import { parseAuthHeader, verifyWalletSignature } from '@/lib/auth/verifySignature'

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
    // ✅ SECURITY: Rate limiting
    const clientIp = getClientIP(request)
    const rateLimitOk = await checkRateLimit(clientIp, 'user-bets', 100, 60)
    if (!rateLimitOk) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // ✅ SECURITY: Input validation
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { address } = body

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }

    // ✅ SECURITY: Verify wallet signature authentication
    const authHeader = request.headers.get('authorization')
    console.debug('[UserBets API] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.debug('[UserBets API] No auth header provided')
      return Response.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const authData = parseAuthHeader(authHeader)
    console.debug('[UserBets API] Auth data parsed:', !!authData, authData ? { address: authData.address.slice(0, 8), timestamp: authData.timestamp } : null)
    
    if (!authData) {
      console.debug('[UserBets API] Failed to parse auth header')
      return Response.json({ 
        error: 'Invalid authentication format',
        code: 'AUTH_INVALID_FORMAT'
      }, { status: 401 })
    }

    // Verify the signature matches the requested address
    if (authData.address.toLowerCase() !== address.toLowerCase()) {
      console.debug('[UserBets API] Address mismatch:', { authAddress: authData.address.slice(0, 8), requestedAddress: address.slice(0, 8) })
      return Response.json({ 
        error: 'Authentication address mismatch',
        code: 'AUTH_ADDRESS_MISMATCH'
      }, { status: 403 })
    }

    // Verify the signature is valid
    console.debug('[UserBets API] Verifying signature for:', authData.address.slice(0, 8))
    const isValidSignature = await verifyWalletSignature(
      authData.address,
      authData.signature,
      authData.timestamp,
      authData.nonce
    )

    console.debug('[UserBets API] Signature verification result:', isValidSignature)
    if (!isValidSignature) {
      return Response.json({ 
        error: 'Invalid or expired signature',
        code: 'AUTH_SIGNATURE_INVALID'
      }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // ✅ STEP 1: Get user's bet involvement from user_activities (fast database query)
    const { data: userActivities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('bet_id, activity_type')
      .eq('wallet_address', address.toLowerCase())
      .in('activity_type', ['create', 'bet'])

    if (activitiesError) {
      console.error('Activities query error:', activitiesError)
      return Response.json({ error: 'Failed to fetch user activities' }, { status: 500 })
    }

    // ✅ STEP 2: Get bet IDs where user is involved
    const userBetIds = new Set<number>()
    
    if (userActivities) {
      for (const activity of userActivities) {
        userBetIds.add(activity.bet_id)
      }
    }

    // ✅ STEP 3: Get bets where user is creator (from bet_mappings)
    const { data: createdBets, error: createdError } = await supabase
      .from('bet_mappings')
      .select('numeric_id')
      .eq('creator_address', address.toLowerCase())

    if (createdError) {
      console.error('Created bets query error:', createdError)
      return Response.json({ error: 'Failed to fetch created bets' }, { status: 500 })
    }

    // Add created bets to the set
    if (createdBets) {
      for (const bet of createdBets) {
        userBetIds.add(bet.numeric_id)
      }
    }

    // ✅ STEP 4: Get complete bet details from database (cached data)
    if (userBetIds.size === 0) {
      return Response.json({ 
        bets: [],
        count: 0,
        source: 'database'
      })
    }

    const { data: betDetails, error: detailsError } = await supabase
      .from('bet_mappings')
      .select(`
        random_id,
        numeric_id,
        bet_name,
        creator_address,
        bet_options,
        end_time,
        total_amounts,
        resolved,
        winning_option,
        created_at
      `)
      .in('numeric_id', Array.from(userBetIds))
      .order('created_at', { ascending: false })

    if (detailsError) {
      console.error('Bet details query error:', detailsError)
      console.error('Query details:', {
        userBetIds: Array.from(userBetIds),
        address: address.toLowerCase()
      })
      return Response.json({ 
        error: 'Failed to fetch bet details',
        details: detailsError.message 
      }, { status: 500 })
    }

    // ✅ STEP 5: Transform data for frontend consumption
    const transformedBets = (betDetails || []).map(bet => {
      // Determine user role
      const isCreator = bet.creator_address.toLowerCase() === address.toLowerCase()
      const hasBetActivity = userActivities?.some(
        activity => activity.bet_id === bet.numeric_id && activity.activity_type === 'bet'
      )
      
      let userRole: 'creator' | 'bettor' | 'both'
      if (isCreator && hasBetActivity) userRole = 'both'
      else if (isCreator) userRole = 'creator'
      else userRole = 'bettor'

      return {
        id: bet.numeric_id,
        randomId: bet.random_id,
        name: bet.bet_name,
        options: bet.bet_options || [],
        creator: bet.creator_address,
        endTime: bet.end_time || 0, // Keep as number for JSON serialization
        resolved: bet.resolved || false,
        winningOption: bet.winning_option || 0,
        totalAmounts: bet.total_amounts || [], // Keep as number array
        userRole,
        userTotalBet: 0, // TODO: Calculate from user_activities
        isPublic: false // Default to false since column might not exist
      }
    })

    return Response.json({
      bets: transformedBets,
      count: transformedBets.length
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Short cache for user-specific data
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('User bets API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}