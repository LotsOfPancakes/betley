// frontend/app/api/bets/public/route.ts
import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'
import { publicClient, BETLEY_ADDRESS } from '@/lib/chain'
import { BETLEY_ABI } from '@/lib/contractABI'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get client IP for rate limiting
    const clientIp = getClientIP(request)

    // ✅ SECURITY: Rate limit public bets queries (100 requests per hour)
    const rateLimitOk = await checkRateLimit(clientIp, 'public-bets', 100, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    // ✅ Parse query parameters for pagination and filtering
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Max 100
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    // ✅ SECURITY: Query only public bets with essential info
    // First try with is_public column, fallback if column doesn't exist
    let { data, error } = await supabase
      .from('bet_mappings')
      .select(`
        random_id,
        numeric_id,
        bet_name,
        creator_address,
        created_at,
        is_public
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If query failed due to missing is_public column, return empty results
    if (error && error.message?.includes('is_public')) {
      console.log('is_public column not found, returning empty results until migration is run')
      data = []
      error = null
    }

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to fetch public bets' }, 
        { status: 500 }
      )
    }

    // ✅ Transform data and fetch real end times from blockchain
    // Using centralized publicClient from chain config
    
    const publicBets = await Promise.all((data || []).map(async (bet) => {
      let endTime = '0'
      let timeRemaining = 'Public Bet'
      
      try {
        // Fetch real end time from blockchain
        const betBasics = await publicClient.readContract({
          address: BETLEY_ADDRESS,
          abi: BETLEY_ABI,
          functionName: 'getBetBasics',
          args: [BigInt(bet.numeric_id)],
        }) as readonly [string, bigint, boolean, number, number, string]
        
        const blockchainEndTime = betBasics[1] // endTime is second element
        endTime = (Number(blockchainEndTime) * 1000).toString() // Convert to milliseconds
        
        // Calculate time remaining
        const now = Date.now()
        const endTimeMs = Number(blockchainEndTime) * 1000
        if (endTimeMs > now) {
          const hoursLeft = Math.ceil((endTimeMs - now) / (1000 * 60 * 60))
          timeRemaining = `${hoursLeft}h left`
        } else {
          timeRemaining = 'Ended'
        }
      } catch (error) {
        console.log(`Failed to fetch end time for bet ${bet.numeric_id}:`, error)
        // Keep placeholder values
      }
      
      return {
        randomId: bet.random_id,
        // ✅ SECURITY: numericId removed to prevent contract enumeration
        name: bet.bet_name,
        creator: bet.creator_address.slice(0, 6) + '...' + bet.creator_address.slice(-4), // ✅ PRIVACY: Anonymize creator address
        createdAt: bet.created_at,
        isPublic: bet.is_public,
        endTime,
        timeRemaining
      }
    }))

    // ✅ Return clean response with caching
    return Response.json(
      { 
        bets: publicBets,
        count: publicBets.length,
        hasMore: publicBets.length === limit
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120', // Standard cache time
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    console.error('Public bets API error:', error)
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}