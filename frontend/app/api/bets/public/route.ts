// frontend/app/api/bets/public/route.ts
import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'

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

    // ✅ SECURITY: Rate limit public bets queries (50 requests per hour)
    const rateLimitOk = await checkRateLimit(clientIp, 'public-bets', 50, 60)
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
    const { data, error } = await supabase
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

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to fetch public bets' }, 
        { status: 500 }
      )
    }

    // ✅ Transform data for frontend consumption
    const publicBets = (data || []).map(bet => ({
      randomId: bet.random_id,
      numericId: bet.numeric_id,
      name: bet.bet_name,
      creator: bet.creator_address,
      createdAt: bet.created_at,
      isPublic: bet.is_public
    }))

    // ✅ SECURITY: Return clean response with caching
    return Response.json(
      { 
        bets: publicBets,
        count: publicBets.length,
        hasMore: publicBets.length === limit
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120', // 1min browser, 2min CDN
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