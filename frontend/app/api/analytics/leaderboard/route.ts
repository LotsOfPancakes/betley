// ============================================================================
// File: frontend/app/api/analytics/leaderboard/route.ts
// ============================================================================

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'  // ✅ KEEP: Use regular client for public leaderboard

export async function GET(request: NextRequest) {
  try {
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
      .select('wallet_address, bets_created, total_volume_created, total_volume_bet, unique_wallets_attracted, last_updated')
      .order(metric, { ascending: false })
      .gt(metric, metric.includes('volume') ? '0' : 0) // Only include users with activity
      .limit(limit)
    
    if (error) {
      console.error('Leaderboard query error:', error)
      throw error
    }
    
    return Response.json({
      metric,
      leaders: leaders || [],
      count: leaders?.length || 0
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