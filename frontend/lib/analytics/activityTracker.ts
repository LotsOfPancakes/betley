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
      activity_type: 'create',
      amount: null,
      block_number: 0, // Use 0 for real-time activities (not from blockchain scan)
      transaction_hash: '', // Use empty string for bet creation (no tx hash yet)
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
      activity_type: 'bet',
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

// Track bet resolution activity
export async function trackBetResolution(
  resolverAddress: string,
  betId: number,
  winningOption: number,
  txHash: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  try {
    // Insert resolution activity
    const activityData = {
      wallet_address: resolverAddress.toLowerCase(),
      bet_id: betId,
      activity_type: 'resolve',
      amount: winningOption.toString(), // Store winning option in amount field
      block_number: 0, // Use 0 for real-time activities
      transaction_hash: txHash,
      created_at: new Date().toISOString()
    }

    console.log('Attempting to insert resolution activity:', activityData)

    const { data: activityResult, error: activityError } = await supabase
      .from('user_activities')
      .insert(activityData)

    if (activityError) {
      console.error('Supabase activity insert error:', activityError)
      throw activityError
    }

    // Update bet_mappings with resolution status
    const { data: updateResult, error: updateError } = await supabase
      .from('bet_mappings')
      .update({
        resolved: true,
        winning_option: winningOption,
        cached_at: new Date().toISOString()
      })
      .eq('numeric_id', betId)

    if (updateError) {
      console.error('Supabase bet update error:', updateError)
      throw updateError
    }

    console.log(`Tracked bet resolution: ${resolverAddress} resolved bet ${betId} with winning option ${winningOption}`, {
      activity: activityResult,
      update: updateResult
    })
  } catch (error) {
    console.error('Error tracking bet resolution:', error)
    // Don't throw - analytics failure shouldn't break bet resolution
  }
}