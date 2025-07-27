import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Await the params promise (Next.js 15+ requirement)
    const { address } = await params
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }
    
    const normalizedAddress = address.toLowerCase()
    
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }
    
    // Return stats or defaults if user not found
    return Response.json({
      wallet_address: normalizedAddress,
      bets_created: stats?.bets_created || 0,
      total_volume_created: stats?.total_volume_created || '0',
      total_volume_bet: stats?.total_volume_bet || '0',
      unique_wallets_attracted: stats?.unique_wallets_attracted || 0,
      last_updated: stats?.last_updated || null
    })
    
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return Response.json({ 
      error: 'Failed to fetch user stats' 
    }, { status: 500 })
  }
}