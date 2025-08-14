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

// Real-time stats calculation from user_activities
function calculateUserStats(activities: any[]) {
  const stats = {
    bets_created: 0,
    total_volume_bet: 0,
    total_volume_created: 0,
    unique_wallets_attracted: new Set<string>(),
    created_bet_ids: new Set<number>(),
    first_activity_at: null as string | null,
    last_activity_at: null as string | null
  }
  
  // Sort activities by date to get first/last activity
  const sortedActivities = activities.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  if (sortedActivities.length > 0) {
    stats.first_activity_at = sortedActivities[0].created_at
    stats.last_activity_at = sortedActivities[sortedActivities.length - 1].created_at
  }
  
  // First pass: collect created bets
  for (const activity of activities) {
    if (activity.activity_type === 'create') {
      stats.bets_created += 1
      stats.created_bet_ids.add(activity.bet_id)
    }
  }
  
  // Second pass: process betting activities
  for (const activity of activities) {
    if (activity.activity_type === 'bet' && activity.amount) {
      const amount = parseInt(activity.amount) || 0
      stats.total_volume_bet += amount
    }
  }
  
  // Third pass: calculate volume created (others betting on user's bets)
  // We need to get all betting activities on bets created by this user
  return {
    bets_created: stats.bets_created,
    total_volume_bet: stats.total_volume_bet.toString(),
    total_volume_created: '0', // Will calculate this separately
    unique_wallets_attracted: 0, // Will calculate this separately  
    first_activity_at: stats.first_activity_at,
    last_activity_at: stats.last_activity_at,
    last_updated: new Date().toISOString()
  }
}

// Calculate volume created and unique wallets (requires cross-user query)
async function calculateVolumeCreated(supabase: any, userAddress: string, createdBetIds: number[]) {
  if (createdBetIds.length === 0) {
    return { total_volume_created: '0', unique_wallets_attracted: 0 }
  }
  
  // Get all betting activities on this user's created bets
  const { data: bettingActivities, error } = await supabase
    .from('user_activities')
    .select('wallet_address, amount, bet_id')
    .eq('activity_type', 'bet')
    .in('bet_id', createdBetIds)
    .neq('wallet_address', userAddress.toLowerCase()) // Exclude user's own bets
  
  if (error) {
    console.error('Error fetching betting activities:', error)
    return { total_volume_created: '0', unique_wallets_attracted: 0 }
  }
  
  let totalVolumeCreated = 0
  const uniqueWallets = new Set<string>()
  
  for (const activity of bettingActivities || []) {
    if (activity.amount) {
      totalVolumeCreated += parseInt(activity.amount) || 0
      uniqueWallets.add(activity.wallet_address)
    }
  }
  
  return {
    total_volume_created: totalVolumeCreated.toString(),
    unique_wallets_attracted: uniqueWallets.size
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // ✅ SECURITY: Rate limiting
    const clientIp = getClientIP(request)
    const rateLimitOk = await checkRateLimit(clientIp, 'user-stats', 100, 60)
    if (!rateLimitOk) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Await the params promise (Next.js 15+ requirement)
    const { address } = await params
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }
    
    const normalizedAddress = address.toLowerCase()

    // ✅ SECURITY: Verify wallet signature authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return Response.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const authData = parseAuthHeader(authHeader)
    
    if (!authData) {
      return Response.json({ 
        error: 'Invalid authentication format',
        code: 'AUTH_INVALID_FORMAT'
      }, { status: 401 })
    }

    // Verify the signature matches the requested address
    if (authData.address.toLowerCase() !== normalizedAddress) {
      return Response.json({ 
        error: 'Authentication address mismatch',
        code: 'AUTH_ADDRESS_MISMATCH'
      }, { status: 403 })
    }

    // Verify the signature is valid
    const isValidSignature = await verifyWalletSignature(
      authData.address,
      authData.signature,
      authData.timestamp,
      authData.nonce
    )
    if (!isValidSignature) {
      return Response.json({ 
        error: 'Invalid or expired signature',
        code: 'AUTH_SIGNATURE_INVALID'
      }, { status: 401 })
    }
    
    // Create fresh Supabase client for this request
    const supabase = createServerSupabaseClient()
    
    // ✅ NEW APPROACH: Get all user activities for real-time calculation
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('wallet_address, bet_id, activity_type, amount, created_at')
      .eq('wallet_address', normalizedAddress)
      .order('created_at', { ascending: true })
    
    if (activitiesError) {
      console.error('Error fetching user activities:', activitiesError)
      throw activitiesError
    }
    
    // Calculate basic stats from user's own activities
    const basicStats = calculateUserStats(activities || [])
    
    // Get created bet IDs for volume calculation
    const createdBetIds = (activities || [])
      .filter(a => a.activity_type === 'create')
      .map(a => a.bet_id)
    
    // Calculate volume created and unique wallets attracted
    const volumeStats = await calculateVolumeCreated(supabase, normalizedAddress, createdBetIds)
    
    // Combine all stats
    const finalStats = {
      wallet_address: normalizedAddress,
      bets_created: basicStats.bets_created,
      total_volume_bet: basicStats.total_volume_bet,
      total_volume_created: volumeStats.total_volume_created,
      unique_wallets_attracted: volumeStats.unique_wallets_attracted,
      first_activity_at: basicStats.first_activity_at,
      last_activity_at: basicStats.last_activity_at,
      last_updated: basicStats.last_updated
    }
    
    return Response.json(finalStats, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Short cache for real-time data
        'X-Content-Type-Options': 'nosniff'
      }
    })
    
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return Response.json({ 
      error: 'Failed to calculate user stats' 
    }, { status: 500 })
  }
}