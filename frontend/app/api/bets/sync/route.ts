// ============================================================================
// File: frontend/app/api/bets/sync/route.ts
// Background sync process for blockchain data (Phase 2)
// Purpose: Keep database cache fresh with blockchain data
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createPublicClient, http, parseAbi } from 'viem'
import { hyperevm } from '@/lib/chains'

// Create RPC client for contract calls
const publicClient = createPublicClient({
  chain: hyperevm,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

const BETLEY_ADDRESS = process.env.NEXT_PUBLIC_BETLEY_ADDRESS as `0x${string}`
const BETLEY_ABI = parseAbi([
  'function getBetDetails(uint256 betId) external view returns (string memory, string[] memory, address, uint256, bool, uint8, uint256[])'
])

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Check authorization (cron secret or admin)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // ✅ STEP 1: Get bets that need syncing (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: staleBets, error: staleError } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id, bet_name, cached_at')
      .or(`cached_at.is.null,cached_at.lt.${fiveMinutesAgo}`)
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

        // Get fresh data from blockchain
        const betData = await publicClient.readContract({
          address: BETLEY_ADDRESS,
          abi: BETLEY_ABI,
          functionName: 'getBetDetails',
          args: [BigInt(bet.numeric_id)]
        }) as readonly [string, readonly string[], `0x${string}`, bigint, boolean, number, readonly bigint[]]

        // Update database with fresh data
        const { error: updateError } = await supabase
          .from('bet_mappings')
          .update({
            bet_options: betData[1] as string[],
            end_time: Number(betData[3]),
            total_amounts: betData[6].map(amount => Number(amount)),
            resolved: betData[4],
            winning_option: betData[4] ? betData[5] : null,
            cached_at: new Date().toISOString()
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