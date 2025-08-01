// ============================================================================
// File: frontend/app/api/analytics/daily-update/route.ts
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'  
import { getBlockchainEvents, getLastProcessedBlock, updateLastProcessedBlock, ProcessedEvent } from '@/lib/analytics/eventProcessor'
import { recalculateAllUserStats } from '@/lib/analytics/statsCalculator'
import { createPublicClient, http } from 'viem'
import { hyperevm } from '@/lib/chains'
import type { SupabaseClient } from '@supabase/supabase-js'

const publicClient = createPublicClient({
  chain: hyperevm,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

// force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300 // 5 minutes - adjust based on your needs

// Handle GET requests from Vercel cron
export async function GET(request: NextRequest) {
  return handleAnalyticsUpdate(request)
}

// Handle POST requests for manual triggers
export async function POST(request: NextRequest) {
  return handleAnalyticsUpdate(request)
}

// Auth logic
async function handleAnalyticsUpdate(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  const authHeader = request.headers.get('authorization')
  
  const currentHour = new Date().getUTCHours()
  const cronType = currentHour === 6 ? 'PRIMARY (6 AM UTC)' : currentHour === 18 ? 'SECONDARY (6 PM UTC)' : 'MANUAL/OTHER'
  
  console.log('Cron request received:', {
    userAgent,
    hasAuthHeader: !!authHeader,
    timestamp: new Date().toISOString(),
    cronType,
    utcHour: currentHour
  })

  // More flexible validation
  const isValidCron = userAgent?.includes('vercel-cron') || userAgent?.includes('vercel')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  const isValidManual = authHeader === expectedAuth && process.env.CRON_SECRET
  
  if (!isValidCron && !isValidManual) {
    console.log('Unauthorized cron request:', { userAgent, authHeader: authHeader?.substring(0, 20) + '...' })
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create admin client once
  const supabaseAdmin = createServerSupabaseClient()

  try {
    console.log('Starting daily analytics update...')
    
    // Update processing status to running using admin client
    await supabaseAdmin
      .from('stats_processing')
      .update({ processing_status: 'running' })
      .eq('id', 1)

    // 1. Get blockchain events since last processing
    console.log('=== DAILY UPDATE BLOCK PROCESSING ===')
    const lastProcessedBlock = await getLastProcessedBlock()  
    const currentBlock = await publicClient.getBlockNumber()
    
    console.log(`Current block: ${currentBlock}, Last processed: ${lastProcessedBlock}`)
    
    // Gap detection logic
    const blockRange = currentBlock - lastProcessedBlock
    const EXPECTED_12H_BLOCKS = BigInt(43200) // 12 hours * 3600 seconds * 1 block/second
    const EXPECTED_24H_BLOCKS = BigInt(86400) // 24 hours * 3600 seconds * 1 block/second
    
    let processingMode = 'normal'
    if (blockRange > EXPECTED_24H_BLOCKS * BigInt(2)) {
      processingMode = 'large_gap' // More than 48 hours
      console.log(`🚨 LARGE GAP DETECTED: ${blockRange} blocks (>48h). Using large gap mode.`)
    } else if (blockRange > EXPECTED_24H_BLOCKS) {
      processingMode = 'medium_gap' // 24-48 hours  
      console.log(`⚠️  MEDIUM GAP DETECTED: ${blockRange} blocks (24-48h). Using medium gap mode.`)
    } else if (blockRange > EXPECTED_12H_BLOCKS * BigInt(2)) {
      processingMode = 'small_gap' // 12-24 hours
      console.log(`ℹ️  SMALL GAP DETECTED: ${blockRange} blocks (12-24h). Using small gap mode.`)
    } else {
      console.log(`✅ NORMAL PROCESSING: ${blockRange} blocks (<24h).`)
    }
    
    let eventsProcessed = 0
    
    if (currentBlock > lastProcessedBlock) {
      const fromBlock = lastProcessedBlock + BigInt(1)
      const toBlock = currentBlock
      
      console.log(`Processing blocks ${fromBlock} to ${toBlock}`)
      console.log(`Total blocks to process: ${blockRange}`)
      console.log(`Processing mode: ${processingMode}`)
      
      // Validate block range
      if (fromBlock > toBlock) {
        console.log('Invalid block range: fromBlock > toBlock')
        throw new Error(`Invalid block range: ${fromBlock} > ${toBlock}`)
      }
      
      // Adaptive processing based on gap size
      if (processingMode === 'large_gap') {
        // For very large gaps, process only recent blocks to get system back on track
        console.log(`🚨 Large gap mode: Processing only recent 24h blocks`)
        const limitedFromBlock = toBlock - EXPECTED_24H_BLOCKS + BigInt(1)
        
        try {
          const events = await getBlockchainEvents(limitedFromBlock, toBlock)
          console.log(`Found ${events.length} events to process (large gap recovery)`)
          eventsProcessed = events.length
          await processEvents(events, supabaseAdmin)
          await updateLastProcessedBlock(toBlock)
        } catch (error) {
          console.error('Error processing large gap recovery:', error)
          throw error
        }
      } else if (processingMode === 'medium_gap') {
        // For medium gaps, process in two phases: recent priority, then fill gap
        console.log(`⚠️  Medium gap mode: Processing recent blocks first, then filling gap`)
        const recentFromBlock = toBlock - EXPECTED_12H_BLOCKS + BigInt(1)
        
        try {
          // Phase 1: Process recent 12 hours first (priority)
          const recentEvents = await getBlockchainEvents(recentFromBlock, toBlock)
          console.log(`Found ${recentEvents.length} recent events (priority processing)`)
          
          if (recentEvents.length > 0) {
            await processEvents(recentEvents, supabaseAdmin)
          }
          
          // Phase 2: Fill the gap (older blocks)
          if (fromBlock < recentFromBlock) {
            const gapEvents = await getBlockchainEvents(fromBlock, recentFromBlock - BigInt(1))
            console.log(`Found ${gapEvents.length} gap events (backfill processing)`)
            
            if (gapEvents.length > 0) {
              await processEvents(gapEvents, supabaseAdmin)
            }
            eventsProcessed = recentEvents.length + gapEvents.length
          } else {
            eventsProcessed = recentEvents.length
          }
          
          await updateLastProcessedBlock(toBlock)
        } catch (error) {
          console.error('Error processing medium gap:', error)
          throw error
        }
      } else {
        try {
          const events = await getBlockchainEvents(fromBlock, toBlock)
          console.log(`Found ${events.length} events to process`)
          eventsProcessed = events.length
          
          if (events.length > 0) {
            await processEvents(events, supabaseAdmin)
          } else {
            console.log('No events to process, skipping processEvents')
          }
          
          // Always update the last processed block, even if no events found
          await updateLastProcessedBlock(toBlock)
          
        } catch (error) {
          console.error('Error during blockchain event processing:', error)
          
          // For partial processing errors, still try to update the block if we got some data
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          if (errorMessage && !errorMessage.includes('All') && !errorMessage.includes('chunks failed')) {
            console.log('Attempting to update last processed block despite partial errors')
            try {
              await updateLastProcessedBlock(toBlock)
            } catch (updateError) {
              console.error('Failed to update last processed block:', updateError)
            }
          }
          
          throw error
        }
      }
    } else {
      console.log('No new blocks to process')
    }
    
    // 4. Recalculate user stats from activities
    await recalculateAllUserStats()  
    
    // 5. Clean up old activities (30-day retention)
    await cleanupOldActivities(supabaseAdmin)  
    
    // Update processing status to idle with success metrics using admin client
    await supabaseAdmin
      .from('stats_processing')
      .update({ 
        processing_status: 'idle',
        blocks_processed_last_run: Number(currentBlock - lastProcessedBlock),
        events_processed_last_run: eventsProcessed,
        error_message: null
      })
      .eq('id', 1)
    
    console.log('Daily analytics update completed successfully')
    
    return Response.json({ 
      success: true, 
      blocksProcessed: Number(currentBlock - lastProcessedBlock),
      eventsProcessed,
      message: 'Analytics updated successfully'
    })
    
  } catch (error) {
    console.error('Daily analytics update failed:', error)
    
    // Update processing status to error using admin client
    await supabaseAdmin
      .from('stats_processing')
      .update({ 
        processing_status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', 1)
    
    return Response.json({ 
      error: 'Analytics update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Properly typed function with admin client parameter
async function processEvents(events: ProcessedEvent[], supabaseAdmin: SupabaseClient): Promise<void> {
  console.log(`=== PROCESSING ${events.length} EVENTS ===`)
  
  let successfulEvents = 0
  let skippedEvents = 0
  let failedEvents = 0
  
  for (const event of events) {
    try {
      if (event.type === 'BetCreated') {
        // Store bet creation activity using admin client
        await supabaseAdmin
          .from('user_activities')
          .upsert({
            wallet_address: event.creator!.toLowerCase(),
            bet_id: event.betId,
            activity_type: 'create',
            amount: null,
            block_number: Number(event.blockNumber),
            transaction_hash: event.transactionHash
          })
        successfulEvents++
          
      } else if (event.type === 'BetPlaced') {
        // Store betting activity using admin client
        await supabaseAdmin
          .from('user_activities')
          .upsert({
            wallet_address: event.user!.toLowerCase(),
            bet_id: event.betId,
            activity_type: 'bet',
            amount: event.amount!.toString(),
            block_number: Number(event.blockNumber),
            transaction_hash: event.transactionHash
          })
        
        // Store bet participant for unique wallet calculation using admin client
        await supabaseAdmin
          .from('bet_participants')
          .upsert({
            bet_id: event.betId,
            wallet_address: event.user!.toLowerCase(),
            first_bet_amount: event.amount!.toString(),
            block_number: Number(event.blockNumber)
          })
        successfulEvents++
      }
    } catch (error) {
      // Handle different types of database conflicts
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('duplicate') || errorMsg.includes('unique') || errorMsg.includes('conflict')) {
          console.log(`⏭️  Skipping duplicate event: ${event.transactionHash} (${event.type}, bet ${event.betId})`)
          skippedEvents++
          continue
        }
        
        if (errorMsg.includes('foreign key') || errorMsg.includes('constraint')) {
          console.log(`🔗 Constraint violation for event: ${event.transactionHash} (${event.type}, bet ${event.betId})`)
          skippedEvents++
          continue
        }
      }
      
      console.error(`❌ Error processing event ${event.transactionHash}:`, error)
      failedEvents++
      
      // Continue processing other events instead of throwing immediately
      continue
    }
  }
  
  console.log(`=== EVENT PROCESSING SUMMARY ===`)
  console.log(`✅ Successful: ${successfulEvents}`)
  console.log(`⏭️  Skipped (duplicates): ${skippedEvents}`)
  console.log(`❌ Failed: ${failedEvents}`)
  console.log(`📊 Total processed: ${successfulEvents + skippedEvents}/${events.length}`)
  
  // Only throw error if more than 50% of events failed
  if (failedEvents > events.length / 2) {
    throw new Error(`Too many event processing failures: ${failedEvents}/${events.length} events failed`)
  }
}

// Properly typed function with admin client parameter
async function cleanupOldActivities(supabaseAdmin: SupabaseClient): Promise<void> {
  console.log('Cleaning up old activities...')
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const { count, error } = await supabaseAdmin
    .from('user_activities')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  if (error) {
    console.error('Error cleaning up old activities:', error)
  } else {
    console.log(`Cleaned up ${count || 0} old activity records`)
  }
}