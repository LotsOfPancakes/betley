import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockchainEvents, getLastProcessedBlock, updateLastProcessedBlock, ProcessedEvent } from '@/lib/analytics/eventProcessor'
import { recalculateAllUserStats } from '@/lib/analytics/statsCalculator'
import { createPublicClient, http } from 'viem'
import { hyperevm } from '@/lib/chains'

const publicClient = createPublicClient({
  chain: hyperevm,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

export async function POST(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting daily analytics update...')
    
    // Update processing status
    await supabase
      .from('stats_processing')
      .update({ processing_status: 'running' })
      .eq('id', 1)

    // 1. Get blockchain events since last processing
    const lastProcessedBlock = await getLastProcessedBlock()
    const currentBlock = await publicClient.getBlockNumber()
    
    console.log(`Processing blocks ${lastProcessedBlock + BigInt(1)} to ${currentBlock}`)
    
    if (currentBlock > lastProcessedBlock) {
      const events = await getBlockchainEvents(lastProcessedBlock + BigInt(1), currentBlock)
      console.log(`Found ${events.length} events to process`)
      
      // 2. Process events and store in activities table
      await processEvents(events)
      
      // 3. Update last processed block
      await updateLastProcessedBlock(currentBlock)
    }
    
    // 4. Recalculate user stats from activities
    await recalculateAllUserStats()
    
    // 5. Clean up old activities (30-day retention)
    await cleanupOldActivities()
    
    console.log('Daily analytics update completed successfully')
    
    return Response.json({ 
      success: true, 
      blocksProcessed: Number(currentBlock - lastProcessedBlock),
      message: 'Analytics updated successfully'
    })
    
  } catch (error) {
    console.error('Daily analytics update failed:', error)
    
    await supabase
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

async function processEvents(events: ProcessedEvent[]): Promise<void> {
  for (const event of events) {
    try {
      if (event.type === 'BetCreated') {
        // Store bet creation activity
        await supabase
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
        // Store betting activity
        await supabase
          .from('user_activities')
          .upsert({
            wallet_address: event.user!.toLowerCase(),
            bet_id: event.betId,
            activity_type: 'bet',
            amount: event.amount!.toString(),
            block_number: Number(event.blockNumber),
            transaction_hash: event.transactionHash
          })
        
        // Store bet participant for unique wallet calculation
        await supabase
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
        continue
      }
      throw error
    }
  }
}

async function cleanupOldActivities(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  await supabase
    .from('user_activities')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
}