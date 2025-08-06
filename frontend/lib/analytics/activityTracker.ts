// ============================================================================
// File: frontend/lib/analytics/activityTracker.ts
// Simple real-time activity tracking
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase'

// Track bet creation activity
export async function trackBetCreation(creatorAddress: string, betId: number): Promise<void> {
  const supabase = createServerSupabaseClient()

  try {
    await supabase
      .from('user_activities')
      .insert({
        wallet_address: creatorAddress.toLowerCase(),
        bet_id: betId,
        activity_type: 'bet_created',
        amount: null,
        block_number: null,
        transaction_hash: null,
        created_at: new Date().toISOString()
      })

    console.log(`Tracked bet creation: ${creatorAddress} created bet ${betId}`)
  } catch (error) {
    console.error('Error tracking bet creation:', error)
    // Don't throw - analytics failure shouldn't break bet creation
  }
}

// Track bet placement activity
export async function trackBetPlacement(
  userAddress: string, 
  betId: number, 
  amount: string, 
  txHash: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  try {
    await supabase
      .from('user_activities')
      .insert({
        wallet_address: userAddress.toLowerCase(),
        bet_id: betId,
        activity_type: 'bet_placed',
        amount: amount,
        block_number: null,
        transaction_hash: txHash,
        created_at: new Date().toISOString()
      })

    console.log(`Tracked bet placement: ${userAddress} bet ${amount} on bet ${betId}`)
  } catch (error) {
    console.error('Error tracking bet placement:', error)
    // Don't throw - analytics failure shouldn't break bet placement
  }
}