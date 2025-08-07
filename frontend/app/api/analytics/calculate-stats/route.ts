import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // 1 minute should be plenty

// Handle GET requests from Vercel cron
export async function GET(request: NextRequest) {
  return handleStatsCalculation(request)
}

// Handle POST requests for manual triggers
export async function POST(request: NextRequest) {
  return handleStatsCalculation(request)
}

async function handleStatsCalculation(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  const authHeader = request.headers.get('authorization')
  
  console.log('Stats calculation request:', {
    userAgent,
    hasAuthHeader: !!authHeader,
    timestamp: new Date().toISOString()
  })

  // Auth check
  const isValidCron = userAgent?.includes('vercel-cron') || userAgent?.includes('vercel')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  const isValidManual = authHeader === expectedAuth && process.env.CRON_SECRET
  
  if (!isValidCron && !isValidManual) {
    console.log('Unauthorized stats calculation request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    console.log('Starting stats calculation...')
    
    // Clear existing stats
    const { error: deleteError } = await supabase
      .from('user_stats')
      .delete()
      .neq('wallet_address', '') // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing existing stats:', deleteError)
      throw deleteError
    }

    // Get all activities to process in JavaScript
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('wallet_address, bet_id, activity_type, amount')
    
    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      throw activitiesError
    }

    // Process stats in JavaScript using the same logic as the working SQL
    const userStats = new Map()
    
    // First pass: collect creators and their bet counts
    for (const activity of activities) {
      if (activity.activity_type === 'create') {
        if (!userStats.has(activity.wallet_address)) {
          userStats.set(activity.wallet_address, {
            wallet_address: activity.wallet_address,
            bets_created: 0,
            total_volume_bet: 0,
            total_volume_created: 0,
            unique_wallets_attracted: new Set(),
            created_bet_ids: new Set()
          })
        }
        const stats = userStats.get(activity.wallet_address)
        stats.bets_created += 1
        stats.created_bet_ids.add(activity.bet_id)
      }
    }
    
    // Second pass: process betting activities
    for (const activity of activities) {
      if (activity.activity_type === 'bet' && activity.amount) {
        const amount = parseInt(activity.amount) || 0
        
        // Initialize user if not exists
        if (!userStats.has(activity.wallet_address)) {
          userStats.set(activity.wallet_address, {
            wallet_address: activity.wallet_address,
            bets_created: 0,
            total_volume_bet: 0,
            total_volume_created: 0,
            unique_wallets_attracted: new Set(),
            created_bet_ids: new Set()
          })
        }
        
        // Add to user's total betting volume
        const userStat = userStats.get(activity.wallet_address)
        userStat.total_volume_bet += amount
        
        // Check if this bet was created by someone else (volume created)
        for (const [creatorAddress, creatorStats] of userStats.entries()) {
          if (creatorAddress !== activity.wallet_address && 
              creatorStats.created_bet_ids.has(activity.bet_id)) {
            creatorStats.total_volume_created += amount
            creatorStats.unique_wallets_attracted.add(activity.wallet_address)
          }
        }
      }
    }
    
    // Convert to array and prepare for database insert
    const statsToInsert = Array.from(userStats.values()).map(stats => ({
      wallet_address: stats.wallet_address,
      bets_created: stats.bets_created,
      total_volume_bet: stats.total_volume_bet,
      total_volume_created: stats.total_volume_created,
      unique_wallets_attracted: stats.unique_wallets_attracted.size,
      last_updated: new Date().toISOString()
    }))
    
    // Insert the calculated stats
    const { error: insertError } = await supabase
      .from('user_stats')
      .insert(statsToInsert)
    
    if (insertError) {
      console.error('Error inserting stats:', insertError)
      throw insertError
    }

    console.log('Stats calculation completed successfully')
    console.log('Users processed:', statsToInsert.length)
    
    return NextResponse.json({ 
      success: true,
      usersProcessed: statsToInsert.length,
      message: 'User stats calculated successfully'
    })
    
  } catch (error) {
    console.error('Stats calculation failed:', error)
    
    return NextResponse.json({ 
      error: 'Stats calculation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}