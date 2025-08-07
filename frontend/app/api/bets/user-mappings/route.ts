// ============================================================================
// File: frontend/app/api/bets/user-mappings/route.ts
// ============================================================================

import { NextRequest } from 'next/server'
import { supabase, checkRateLimit, createServerSupabaseClient } from '@/lib/supabase'
import { createPublicClient, http, parseAbi } from 'viem'
import { baseSepolia } from '@/lib/chains'

// Create RPC client for contract calls
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

const BETLEY_ADDRESS = process.env.NEXT_PUBLIC_BETLEY_ADDRESS as `0x${string}`
const BETLEY_ABI = parseAbi([
  'function getUserBets(uint256 betId, address user) external view returns (uint256[] memory)',
  'function getBetDetails(uint256 betId) external view returns (string memory, string[] memory, address, uint256, bool, uint8, uint256[], address)'
])

// Get IP helper function
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
    const rateLimitOk = await checkRateLimit(clientIp, 'batch-lookup', 100, 60)
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

    const { address, maxBetId } = body

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }

    if (typeof maxBetId !== 'number' || maxBetId < 0 || maxBetId > 10000) {
      return Response.json({ error: 'Invalid maxBetId range' }, { status: 400 })
    }

    // ✅ STEP 1: Get all mappings first, then filter by user involvement
    const { data: allMappings, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id, creator_address, is_public')
      .lte('numeric_id', maxBetId)
      .order('numeric_id')

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Database query failed' }, { status: 500 })
    }

    // ✅ STEP 2: Get user participation from database using admin client
    // This is the hybrid fix - use admin client to access protected user_activities table
    const supabaseAdmin = createServerSupabaseClient()
    const { data: userParticipation, error: participationError } = await supabaseAdmin
      .from('user_activities')
      .select('bet_id')
      .eq('wallet_address', address.toLowerCase())
      .eq('activity_type', 'bet')
      .lte('bet_id', maxBetId)

    if (participationError) {
      console.error('Participation query error:', participationError)
      return Response.json({ error: 'Failed to check user participation' }, { status: 500 })
    }

    // Create a Set of bet IDs where the user has placed bets (from database)
    const userBetIdsFromDB = new Set(userParticipation?.map(p => p.bet_id) || [])

    const userMappings: Record<number, string> = {}
    
    if (allMappings) {
      // Process each mapping to determine user involvement
      for (const mapping of allMappings) {
        const numericId = mapping.numeric_id
        const isCreator = mapping.creator_address.toLowerCase() === address.toLowerCase()
        
        // If user is creator, include the mapping
        if (isCreator) {
          userMappings[numericId] = mapping.random_id
          continue
        }

        // If bet is public, include it (users can bet on any public bet)
        if (mapping.is_public) {
          userMappings[numericId] = mapping.random_id
          continue
        }

        // ✅ STEP 3: For private bets, use hybrid approach
        // First check database (fast and reliable for older bets)
        if (userBetIdsFromDB.has(numericId)) {
          userMappings[numericId] = mapping.random_id
          continue
        }

        // ✅ STEP 4: If not in database, check contract (catches recent bets)
        // This handles the timing gap between bet placement and cron job
        try {
          const userBets = await publicClient.readContract({
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getUserBets',
            args: [BigInt(numericId), address as `0x${string}`]
          })

          // If user has placed any bets (total > 0), include the mapping
          const totalBet = userBets.reduce((sum: bigint, amount: bigint) => sum + amount, BigInt(0))
          if (totalBet > BigInt(0)) {
            userMappings[numericId] = mapping.random_id
          }
        } catch (contractError) {
          console.error(`Contract call failed for bet ${numericId}:`, contractError)
          // Don't include this bet if contract call fails
          // This is acceptable since we already checked the database
        }
      }
    }

    return Response.json({ 
      mappings: userMappings,
      count: Object.keys(userMappings).length
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Shorter cache for security
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}