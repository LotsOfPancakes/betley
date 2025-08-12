// ============================================================================
// File: frontend/app/api/analytics/leaderboard/route.ts
// ============================================================================

import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'  // ✅ KEEP: Use regular client for public leaderboard

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

    // ✅ SECURITY: Rate limit leaderboard queries (100 requests per hour)
    const rateLimitOk = await checkRateLimit(clientIp, 'leaderboard', 100, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'total_volume_created'
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100) // Max 100
    
    // Validate metric
    const validMetrics = ['bets_created', 'total_volume_created', 'total_volume_bet', 'unique_wallets_attracted']
    if (!validMetrics.includes(metric)) {
      return Response.json({ error: 'Invalid metric' }, { status: 400 })
    }
    
    // ✅ NOTE: This will work with RLS if we create a public read policy for leaderboards
    // OR we'll need to switch to admin client if leaderboard should be restricted
    const { data: leaders, error } = await supabase
      .from('user_stats')
      .select('wallet_address, bets_created, total_volume_created, total_volume_bet, unique_wallets_attracted')
      .order(metric, { ascending: false })
      .gt(metric, metric.includes('volume') ? '0' : 0) // Only include users with activity
      .limit(limit)
    
    if (error) {
      console.error('Leaderboard query error:', error)
      throw error
    }

    // ✅ PRIVACY: Anonymize wallet addresses for public leaderboard
    const anonymizedLeaders = (leaders || []).map(leader => ({
      wallet_address: leader.wallet_address.slice(0, 6) + '...' + leader.wallet_address.slice(-4),
      bets_created: leader.bets_created,
      total_volume_created: leader.total_volume_created,
      total_volume_bet: leader.total_volume_bet,
      unique_wallets_attracted: leader.unique_wallets_attracted
    }))
    
    return Response.json({
      metric,
      leaders: anonymizedLeaders,
      count: anonymizedLeaders.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min browser, 10min CDN
        'X-Content-Type-Options': 'nosniff'
      }
    })
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return Response.json({ 
      error: 'Failed to fetch leaderboard' 
    }, { status: 500 })
  }
}