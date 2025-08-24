// ============================================================================
// File: frontend/app/api/bets/sync/route.ts
// Background sync process for blockchain data (Phase 2)
// Purpose: Keep database cache fresh with blockchain data
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { publicClient, BETLEY_ADDRESS } from '@/lib/chain'
import { BETLEY_ABI } from '@/lib/contractABI'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Check authorization (cron secret or admin)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // ✅ STEP 1: Get bets that need syncing
    const { data: staleBets, error: staleError } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id, bet_name')
      .limit(10) // Process max 10 bets per sync to avoid rate limits

    if (staleError) {
      console.error('Error fetching stale bets:', staleError)
      return Response.json({ error: 'Failed to fetch stale bets' }, { status: 500 })
    }

    if (!staleBets || staleBets.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No bets need syncing',
        synced: 0
      })
    }

    console.log(`Syncing ${staleBets.length} stale bets...`)

    // ✅ STEP 2: Sync each bet with blockchain (rate-limited)
    const syncResults = []
    
    for (const bet of staleBets) {
      try {
        // Add delay between RPC calls to avoid rate limiting
        if (syncResults.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        }

        console.log(`Syncing bet ${bet.numeric_id}...`)

        // Get fresh data from blockchain using new contract functions
        const [betBasics, betAmounts] = await Promise.all([
          publicClient.readContract({
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetBasics',
            args: [BigInt(bet.numeric_id)]
          }) as Promise<readonly [`0x${string}`, bigint, boolean, number, number, `0x${string}`]>,
          
          publicClient.readContract({
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetAmounts',
            args: [BigInt(bet.numeric_id)]
          }) as Promise<readonly bigint[]>
        ])

        // Update database with fresh data
        const { error: updateError } = await supabase
          .from('bet_mappings')
          .update({
            end_time: Number(betBasics[1]),
            total_amounts: betAmounts.map(amount => Number(amount)),
            resolved: betBasics[2],
            winning_option: betBasics[2] ? betBasics[3] : null
          })
          .eq('numeric_id', bet.numeric_id)

        if (updateError) {
          console.error(`Error updating bet ${bet.numeric_id}:`, updateError)
          syncResults.push({ id: bet.numeric_id, success: false, error: updateError.message })
        } else {
          console.log(`Successfully synced bet ${bet.numeric_id}`)
          syncResults.push({ id: bet.numeric_id, success: true })
        }

      } catch (error) {
        console.error(`Error syncing bet ${bet.numeric_id}:`, error)
        syncResults.push({ 
          id: bet.numeric_id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = syncResults.filter(r => r.success).length
    const failureCount = syncResults.filter(r => !r.success).length

    return Response.json({
      success: true,
      synced: successCount,
      failed: failureCount,
      total: staleBets.length,
      results: syncResults,
      message: `Synced ${successCount}/${staleBets.length} bets successfully`
    })

  } catch (error) {
    console.error('Sync process error:', error)
    return Response.json({ error: 'Sync process failed' }, { status: 500 })
  }
}