// ============================================================================
// File: frontend/app/api/analytics/daily-stats/route.ts
// Simple daily stats calculation from user activities
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

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
  
  console.log('Daily stats calculation request:', {
    userAgent,
    hasAuthHeader: !!authHeader,
    timestamp: new Date().toISOString()
  })

  // Simple auth check
  const isValidCron = userAgent?.includes('vercel-cron') || userAgent?.includes('vercel')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  const isValidManual = authHeader === expectedAuth && process.env.CRON_SECRET
  
  if (!isValidCron && !isValidManual) {
    console.log('Unauthorized stats calculation request')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    console.log('Starting daily stats calculation...')
    
    // Calculate stats from user_activities table
    const { data: statsData, error: statsError } = await supabase.rpc('calculate_user_stats')
    
    if (statsError) {
      console.error('Error calculating stats:', statsError)
      throw statsError
    }

    console.log('Daily stats calculation completed successfully')
    console.log('Stats calculated for users:', statsData?.length || 0)
    
    return Response.json({ 
      success: true,
      usersProcessed: statsData?.length || 0,
      message: 'Daily stats calculated successfully'
    })
    
  } catch (error) {
    console.error('Daily stats calculation failed:', error)
    
    return Response.json({ 
      error: 'Stats calculation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}