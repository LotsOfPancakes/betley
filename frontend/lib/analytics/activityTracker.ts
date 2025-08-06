// ============================================================================
// File: frontend/lib/analytics/activityTracker.ts
// Simple real-time activity tracking
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase'

// Track bet creation activity
export async function trackBetCreation(creatorAddress: string, betId: number): Promise<void> {
  const supabase = createServerSupabaseClient()

  try {
    const insertData = {
      wallet_address: creatorAddress.toLowerCase(),
      bet_id: betId,
      activity_type: 'bet_created',
      amount: null,
      block_number: 0, // Use 0 for real-time activities (not from blockchain scan)
      transaction_hash: null,
      created_at: new Date().toISOString()
    }

    console.log('Attempting to insert bet creation activity:', insertData)

    const { data, error } = await supabase
      .from('user_activities')
      .insert(insertData)

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    console.log(`Tracked bet creation: ${creatorAddress} created bet ${betId}`, data)
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
    const insertData = {
      wallet_address: userAddress.toLowerCase(),
      bet_id: betId,
      activity_type: 'bet_placed',
      amount: amount,
      block_number: 0, // Use 0 for real-time activities (not from blockchain scan)
      transaction_hash: txHash,
      created_at: new Date().toISOString()
    }

    console.log('Attempting to insert activity:', insertData)

    const { data, error } = await supabase
      .from('user_activities')
      .insert(insertData)

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    console.log(`Tracked bet placement: ${userAddress} bet ${amount} on bet ${betId}`, data)
  } catch (error) {
    console.error('Error tracking bet placement:', error)
    // Don't throw - analytics failure shouldn't break bet placement
  }
}