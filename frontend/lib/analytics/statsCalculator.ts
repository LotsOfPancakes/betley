import { supabase } from '@/lib/supabase'
import { createPublicClient, http, parseAbi } from 'viem'
import { hyperevm } from '@/lib/chains'

const publicClient = createPublicClient({
  chain: hyperevm,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

const BETLEY_ADDRESS = process.env.NEXT_PUBLIC_BETLEY_ADDRESS as `0x${string}`

const BETLEY_ABI = parseAbi([
  'function getBetDetails(uint256 betId) external view returns (string memory, string[] memory, address, uint256, bool, uint8, uint256[], address)'
])

export async function recalculateAllUserStats(): Promise<void> {
  console.log('Starting user stats recalculation...')
  
  // 1. Get all unique wallet addresses from activities
  const { data: wallets, error: walletsError } = await supabase
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

export async function recalculateUserStats(walletAddress: string): Promise<void> {
  const normalizedAddress = walletAddress.toLowerCase()
  
  // 1. Calculate bets created
  const { data: createdBets } = await supabase
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', normalizedAddress)
    .eq('activity_type', 'create')
  
  const betsCreated = createdBets?.length || 0
  
  // 2. Calculate personal betting volume
  const { data: personalBets } = await supabase
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
  
  // 5. Update user stats
  await supabase
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

async function calculateVolumeCreatedByOthers(creatorAddress: string): Promise<bigint> {
  // Get all bets created by this user
  const { data: createdBets } = await supabase
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', creatorAddress)
    .eq('activity_type', 'create')
  
  if (!createdBets?.length) return BigInt(0)
  
  const betIds = createdBets.map(b => b.bet_id)
  let totalVolume = BigInt(0)
  
  for (const betId of betIds) {
    // Check if bet is resolved using smart contract
    const isResolved = await isBetResolved(betId)
    if (!isResolved) continue // Only count resolved bets
    
    // Get all bets placed on this bet by others (excluding creator)
    const { data: othersBets } = await supabase
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

async function calculateUniqueWalletsAttracted(creatorAddress: string): Promise<number> {
  // Get all bets created by this user
  const { data: createdBets } = await supabase
    .from('user_activities')
    .select('bet_id')
    .eq('wallet_address', creatorAddress)
    .eq('activity_type', 'create')
  
  if (!createdBets?.length) return 0
  
  const betIds = createdBets.map(b => b.bet_id)
  
  // Get unique participants across all their bets (excluding creator)
  const { data: participants } = await supabase
    .from('bet_participants')
    .select('wallet_address')
    .in('bet_id', betIds)
    .neq('wallet_address', creatorAddress)
  
  const uniqueParticipants = new Set(participants?.map(p => p.wallet_address) || [])
  return uniqueParticipants.size
}

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