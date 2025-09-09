// ============================================================================
// File: frontend/app/api/bets/user-bets/route.ts
// Database-first user bets query API (Phase 2)
// Purpose: Eliminate RPC rate limiting by querying database first
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, checkRateLimit } from '@/lib/supabase'
import { publicClient } from '@/lib/chain'
import { BETLEY_ADDRESS, BETLEY_ABI } from '@/lib/contractABI'
import { parseAuthHeader, verifyWalletSignature } from '@/lib/auth/verifySignature'
import { getClientIP } from '@/lib/utils/request'

// Helper function to fetch live bet amounts when database data is stale/missing
async function getLiveBetAmounts(betId: number): Promise<number[]> {
  try {
    const betAmounts = await publicClient.readContract({
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetAmounts',
      args: [BigInt(betId)]
    }) as readonly bigint[]

    const amounts = betAmounts.map(amount => Number(amount))
    console.log(`✅ Live data fetched for bet ${betId}:`, amounts)
    return amounts
  } catch (error) {
    // More specific error logging for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('timeout')) {
      console.error(`⏱️ RPC timeout for bet ${betId}`)
    } else if (errorMessage.includes('rate limit')) {
      console.error(`🚫 Rate limited for bet ${betId}`)
    } else {
      console.error(`❌ RPC error for bet ${betId}:`, errorMessage)
    }
    return []
  }
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

    // ✅ STEP 5: Transform data for frontend consumption with batch RPC processing
    
    // Step 1: Pre-process all bets and identify which need live blockchain data
    const processedBets = []
    const betsNeedingLiveData = []
    
    for (const bet of betDetails || []) {
      // Determine user role
      const isCreator = bet.creator_address.toLowerCase() === address.toLowerCase()
      const hasBetActivity = userActivities?.some(
        activity => activity.bet_id === bet.numeric_id && activity.activity_type === 'bet'
      )
      
      let userRole: 'creator' | 'bettor' | 'both'
      if (isCreator && hasBetActivity) userRole = 'both'
      else if (isCreator) userRole = 'creator'
      else userRole = 'bettor'

      // Check if database total_amounts are missing or all zeros
      const hasValidAmounts = bet.total_amounts?.length > 0 && 
        bet.total_amounts.some((amount: string) => amount > '0')
      
      if (!hasValidAmounts) {
        betsNeedingLiveData.push(bet.numeric_id)
      }
      
      processedBets.push({
        bet,
        userRole,
        needsLiveData: !hasValidAmounts
      })
    }

    // Step 2: Batch fetch live data with timeout protection and error handling
    const liveDataMap = new Map()
    
    if (betsNeedingLiveData.length > 0) {
      console.log(`Fetching live data for ${betsNeedingLiveData.length} bets`)
      
      const liveDataPromises = betsNeedingLiveData.map(async (betId, index) => {
        // Stagger requests to avoid overwhelming RPC provider
        await new Promise(resolve => setTimeout(resolve, index * 150)) // 150ms stagger
        
        try {
          // Add timeout wrapper to prevent hanging requests
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 8000) // 8s timeout
          )
          
          const dataPromise = getLiveBetAmounts(betId)
          const amounts = await Promise.race([dataPromise, timeoutPromise])
          
          return { betId, amounts, success: true }
        } catch (error) {
          console.error(`RPC failed for bet ${betId}:`, error)
          return { betId, amounts: [], success: false }
        }
      })

      // Execute all RPC calls in parallel with error isolation
      const liveDataResults = await Promise.allSettled(liveDataPromises)
      
      // Create lookup map for successful results
      liveDataResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          liveDataMap.set(result.value.betId, result.value.amounts)
        }
      })
      
      console.log(`Successfully fetched live data for ${liveDataMap.size}/${betsNeedingLiveData.length} bets`)
    }

    // Step 3: Final transformation with live data merged in
    const transformedBets = processedBets.map(({ bet, userRole, needsLiveData }) => {
      let totalAmounts = bet.total_amounts || []
      
      if (needsLiveData) {
        // Use live data if available, fallback to empty array if RPC failed
        totalAmounts = liveDataMap.get(bet.numeric_id) || []
      }

      return {
        id: bet.numeric_id,
        randomId: bet.random_id,
        name: bet.bet_name,
        options: bet.bet_options || [],
        creator: bet.creator_address,
        endTime: bet.end_time || 0,
        resolved: bet.resolved || false,
        winningOption: bet.winning_option || 0,
        totalAmounts,
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