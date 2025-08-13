// ============================================================================
// File: frontend/lib/analytics/statsCalculator.ts
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase'  
import { createPublicClient, parseAbi } from 'viem'
import { baseSepolia } from '@reown/appkit/networks'
import { createFallbackTransport } from '@/lib/config'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: createFallbackTransport()
})

const BETLEY_ADDRESS = process.env.NEXT_PUBLIC_BETLEY_ADDRESS as `0x${string}`

const BETLEY_ABI = parseAbi([
  'function getBetDetails(uint256 betId) external view returns (string memory, string[] memory, address, uint256, bool, uint8, uint256[], address)'
])

// ✅ COMPLETE: Main function with proper admin client usage
export async function recalculateAllUserStats(): Promise<void> {
  console.log('Starting user stats recalculation...')
  
  // ✅ Use admin client for accessing protected user_activities table
  const supabaseAdmin = createServerSupabaseClient()
  
  // 1. Get all unique wallet addresses from activities using the same pattern as original
  const { data: wallets, error: walletsError } = await supabaseAdmin
    .from('user_activities')
    .select('wallet_address')
    .then(result => ({
      ...result,
      data: result.data ? [...new Set(result.data.map(w => w.wallet_address))] : null
    }))
  
  if (walletsError) throw walletsError
  if (!wallets) return
  
  console.log(`Recalculating stats for ${wallets.length} wallets...`)
  
  // 2. Calculate stats for each wallet
  for (const walletAddress of wallets) {
    await recalculateUserStats(walletAddress)
  }
  
  console.log('User stats recalculation completed')
}

// ✅ COMPLETE: Individual user stats calculation with admin client
export async function recalculateUserStats(walletAddress: string): Promise<void> {
  const supabaseAdmin = createServerSupabaseClient()
  const normalizedAddress = walletAddress.toLowerCase()
  
  // 1. Calculate bets created using admin client
  const { data: createdBets } = await supabaseAdmin
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', normalizedAddress)
    .eq('activity_type', 'create')
  
  const betsCreated = createdBets?.length || 0
  
  // 2. Calculate personal betting volume using admin client
  const { data: personalBets } = await supabaseAdmin
    .from('user_activities')
    .select('amount')
    .eq('wallet_address', normalizedAddress)
    .eq('activity_type', 'bet')
  
  const totalVolumeBet = personalBets?.reduce((sum, bet) => 
    sum + BigInt(bet.amount || 0), BigInt(0)
  ) || BigInt(0)
  
  // 3. Calculate volume created by others on their bets (complex query)
  const totalVolumeCreated = await calculateVolumeCreatedByOthers(normalizedAddress)
  
  // 4. Calculate unique wallets attracted
  const uniqueWalletsAttracted = await calculateUniqueWalletsAttracted(normalizedAddress)
  
  // ✅ 5. Update user stats using admin client
  await supabaseAdmin
    .from('user_stats')
    .upsert({
      wallet_address: normalizedAddress,
      bets_created: betsCreated,
      total_volume_created: totalVolumeCreated.toString(),
      total_volume_bet: totalVolumeBet.toString(),
      unique_wallets_attracted: uniqueWalletsAttracted,
      last_updated: new Date().toISOString()
    })
}

// ✅ COMPLETE: Calculate volume created by others - complex business logic preserved
async function calculateVolumeCreatedByOthers(creatorAddress: string): Promise<bigint> {
  const supabaseAdmin = createServerSupabaseClient()
  
  // Get all bets created by this user using admin client
  const { data: createdBets } = await supabaseAdmin
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', creatorAddress)
    .eq('activity_type', 'create')
  
  if (!createdBets?.length) return BigInt(0)
  
  const betIds = createdBets.map(b => b.bet_id)
  let totalVolume = BigInt(0)
  
  for (const betId of betIds) {
    // ✅ PRESERVED: Check if bet is resolved using smart contract (important business logic)
    const isResolved = await isBetResolved(betId)
    if (!isResolved) continue // Only count resolved bets
    
    // Get all bets placed on this bet by others (excluding creator) using admin client
    const { data: othersBets } = await supabaseAdmin
      .from('user_activities')
      .select('amount')
      .eq('bet_id', betId)
      .eq('activity_type', 'bet')
      .neq('wallet_address', creatorAddress)
    
    const betVolume = othersBets?.reduce((sum, bet) => 
      sum + BigInt(bet.amount || 0), BigInt(0)
    ) || BigInt(0)
    
    totalVolume += betVolume
  }
  
  return totalVolume
}

// ✅ COMPLETE: Calculate unique wallets attracted - preserved original logic
async function calculateUniqueWalletsAttracted(creatorAddress: string): Promise<number> {
  const supabaseAdmin = createServerSupabaseClient()
  
  // Get all bets created by this user using admin client
  const { data: createdBets } = await supabaseAdmin
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', creatorAddress)
    .eq('activity_type', 'create')
  
  if (!createdBets?.length) return 0
  
  const betIds = createdBets.map(b => b.bet_id)
  
  // ✅ PRESERVED: Use bet_participants table for unique wallet calculation
  const { data: participants } = await supabaseAdmin
    .from('bet_participants')
    .select('wallet_address')
    .in('bet_id', betIds)
    .neq('wallet_address', creatorAddress)
  
  const uniqueParticipants = new Set(participants?.map(p => p.wallet_address) || [])
  return uniqueParticipants.size
}

// ✅ COMPLETE: Smart contract interaction preserved exactly as original
async function isBetResolved(betId: number): Promise<boolean> {
  try {
    const betDetails = await publicClient.readContract({
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)]
    })
    
    // betDetails[4] is the resolved boolean
    return betDetails[4] as boolean
  } catch (error) {
    console.error(`Error checking if bet ${betId} is resolved:`, error)
    return false
  }
}