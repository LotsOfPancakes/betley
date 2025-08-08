// ============================================================================
// File: frontend/lib/analytics/userStats.ts
// Real-time user statistics management
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase'

export interface UserStatsUpdate {
  wallet_address: string
  bets_created?: number
  total_volume_created?: string
  total_volume_bet?: string
  unique_wallets_attracted?: number
}

export interface BetPlacementData {
  betId: number
  userAddress: string
  creatorAddress: string
  amount: string
  txHash: string
}

// Update user stats for bet creation
export async function updateBetCreationStats(creatorAddress: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  const normalizedAddress = creatorAddress.toLowerCase()

  try {
    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('bets_created')
      .eq('wallet_address', normalizedAddress)
      .single()

    const newBetsCreated = (currentStats?.bets_created || 0) + 1

    // Update stats
    await supabase
      .from('user_stats')
      .upsert({
        wallet_address: normalizedAddress,
        bets_created: newBetsCreated,
        last_updated: new Date().toISOString()
      })

    console.log(`Updated bet creation stats for ${normalizedAddress}: ${newBetsCreated} bets created`)
  } catch (error) {
    console.error('Error updating bet creation stats:', error)
    // Don't throw - analytics failure shouldn't break bet creation
  }
}

// Update user stats for bet placement
export async function updateBetPlacementStats(data: BetPlacementData): Promise<void> {
  const supabase = createServerSupabaseClient()
  const normalizedUserAddress = data.userAddress.toLowerCase()
  const normalizedCreatorAddress = data.creatorAddress.toLowerCase()
  const betAmount = BigInt(data.amount)

  try {
    // 1. Update bettor's personal stats (amount they've bet)
    const { data: bettorStats } = await supabase
      .from('user_stats')
      .select('total_volume_bet')
      .eq('wallet_address', normalizedUserAddress)
      .single()

    const currentVolumeBet = BigInt(bettorStats?.total_volume_bet || '0')
    const newVolumeBet = currentVolumeBet + betAmount

    await supabase
      .from('user_stats')
      .upsert({
        wallet_address: normalizedUserAddress,
        total_volume_bet: newVolumeBet.toString(),
        last_updated: new Date().toISOString()
      })

    // 2. Update creator's generated volume stats
    const { data: creatorStats } = await supabase
      .from('user_stats')
      .select('total_volume_created')
      .eq('wallet_address', normalizedCreatorAddress)
      .single()

    const currentVolumeCreated = BigInt(creatorStats?.total_volume_created || '0')
    const newVolumeCreated = currentVolumeCreated + betAmount

    // 3. Calculate unique wallets attracted to creator's bets
    const uniqueWallets = await calculateUniqueWalletsAttracted(normalizedCreatorAddress, data.betId, normalizedUserAddress)

    await supabase
      .from('user_stats')
      .upsert({
        wallet_address: normalizedCreatorAddress,
        total_volume_created: newVolumeCreated.toString(),
        unique_wallets_attracted: uniqueWallets,
        last_updated: new Date().toISOString()
      })

    // 4. Track bet participant for unique wallet calculation
    await supabase
      .from('bet_participants')
      .upsert({
        bet_id: data.betId,
        wallet_address: normalizedUserAddress,
        first_bet_amount: data.amount,
        block_number: null // Will be updated by batch job if needed
      })

    console.log(`Updated bet placement stats:`)
    console.log(`  Bettor ${normalizedUserAddress}: ${newVolumeBet.toString()} total volume bet`)
    console.log(`  Creator ${normalizedCreatorAddress}: ${newVolumeCreated.toString()} total volume created, ${uniqueWallets} unique wallets`)

  } catch (error) {
    console.error('Error updating bet placement stats:', error)
    // Don't throw - analytics failure shouldn't break bet placement
  }
}

// Calculate unique wallets attracted to a creator's bets
async function calculateUniqueWalletsAttracted(creatorAddress: string, currentBetId: number, newParticipant: string): Promise<number> {
  const supabase = createServerSupabaseClient()

  try {
    // Get all bets created by this user
    const { data: createdBets } = await supabase
      .from('bet_mappings')
      .select('numeric_id')
      .eq('creator_address', creatorAddress)

    if (!createdBets?.length) return 0

    const betIds = createdBets.map(b => b.numeric_id)

    // Get all unique participants across all their bets
    const { data: participants } = await supabase
      .from('bet_participants')
      .select('wallet_address')
      .in('bet_id', betIds)
      .neq('wallet_address', creatorAddress) // Exclude creator

    // Create set of unique participants (including the new one)
    const uniqueParticipants = new Set(participants?.map(p => p.wallet_address) || [])
    uniqueParticipants.add(newParticipant) // Add current participant

    return uniqueParticipants.size
  } catch (error) {
    console.error('Error calculating unique wallets attracted:', error)
    return 0
  }
}

// Get bet creator address from bet ID
export async function getBetCreator(betId: number): Promise<string | null> {
  const supabase = createServerSupabaseClient()

  try {
    const { data: betMapping } = await supabase
      .from('bet_mappings')
      .select('creator_address')
      .eq('numeric_id', betId)
      .single()

    return betMapping?.creator_address || null
  } catch (error) {
    console.error('Error getting bet creator:', error)
    return null
  }
}