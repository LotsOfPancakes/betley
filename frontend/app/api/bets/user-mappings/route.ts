// Fixed Privacy-Preserving User Mappings API
// File: frontend/app/api/bets/user-mappings/route.ts

import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'
import { createPublicClient, http, parseAbi } from 'viem'
import { hyperevm } from '@/lib/chains'

// Create RPC client for contract calls
const publicClient = createPublicClient({
  chain: hyperevm,
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

    // ✅ PRIVACY FIX: Get all mappings first, then filter by user involvement
    const { data: allMappings, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id, creator_address, is_public')
      .lte('numeric_id', maxBetId)
      .order('numeric_id')

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Database query failed' }, { status: 500 })
    }

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

        // For private bets where user is not creator, check if they've bet
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
          console.error(`Error checking bets for ${numericId}:`, contractError)
          // Skip this bet if contract call fails
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