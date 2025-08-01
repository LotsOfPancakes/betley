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
  
  console.log('Cron request received:', {
    userAgent,
    hasAuthHeader: !!authHeader,
    timestamp: new Date().toISOString()
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
    const lastProcessedBlock = await getLastProcessedBlock()  
    const currentBlock = await publicClient.getBlockNumber()
    
    console.log(`Processing blocks ${lastProcessedBlock + BigInt(1)} to ${currentBlock}`)
    
    let eventsProcessed = 0
    
    if (currentBlock > lastProcessedBlock) {
      const events = await getBlockchainEvents(lastProcessedBlock + BigInt(1), currentBlock)
      console.log(`Found ${events.length} events to process`)
      
      // 2. Process events and store in activities table
      eventsProcessed = events.length
      await processEvents(events, supabaseAdmin)  
      
      // 3. Update last processed block
      await updateLastProcessedBlock(currentBlock)  
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
  console.log(`Processing ${events.length} events...`)
  
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
      }
    } catch (error) {
      // Skip duplicate events (unique constraint violations)
      if (error instanceof Error && error.message.includes('duplicate')) {
        console.log(`Skipping duplicate event: ${event.transactionHash}`)
        continue
      }
      console.error(`Error processing event ${event.transactionHash}:`, error)
      throw error
    }
  }
  
  console.log(`Successfully processed ${events.length} events`)
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