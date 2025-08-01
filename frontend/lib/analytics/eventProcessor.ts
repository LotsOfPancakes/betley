// ============================================================================
// File: frontend/lib/analytics/eventProcessor.ts
// ============================================================================

import { createPublicClient, http, parseAbi } from 'viem'
import { createServerSupabaseClient } from '@/lib/supabase'  
import { hyperevm } from '@/lib/chains'

const publicClient = createPublicClient({
  chain: hyperevm,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL)
})

const BETLEY_ADDRESS = process.env.NEXT_PUBLIC_BETLEY_ADDRESS as `0x${string}`

const BETLEY_EVENTS_ABI = parseAbi([
  'event BetCreated(uint256 indexed betId, address indexed creator, string name, address token)',
  'event BetPlaced(uint256 indexed betId, address indexed user, uint8 option, uint256 amount)'
])

export interface ProcessedEvent {
  type: 'BetCreated' | 'BetPlaced'
  betId: number
  creator?: string
  user?: string
  amount?: bigint
  blockNumber: bigint
  transactionHash: string
}

export async function getBlockchainEvents(
  fromBlock: bigint,
  toBlock: bigint
): Promise<ProcessedEvent[]> {
  // Validate inputs
  if (fromBlock > toBlock) {
    throw new Error(`Invalid block range: fromBlock (${fromBlock}) > toBlock (${toBlock})`)
  }
  
  if (fromBlock < BigInt(1)) {
    console.log(`Adjusting fromBlock from ${fromBlock} to 1`)
    fromBlock = BigInt(1)
  }
  
  const MAX_BLOCK_RANGE = BigInt(1000)
  const allLogs: ProcessedEvent[] = []
  const failedRanges: Array<{from: bigint, to: bigint, error: string}> = []
  let successfulChunks = 0
  let totalChunks = 0
  
  let currentFromBlock = fromBlock
  
  while (currentFromBlock <= toBlock) {
    const currentToBlock = currentFromBlock + MAX_BLOCK_RANGE - BigInt(1) > toBlock 
      ? toBlock 
      : currentFromBlock + MAX_BLOCK_RANGE - BigInt(1)
    
    totalChunks++
    console.log(`Fetching events from block ${currentFromBlock} to ${currentToBlock} (chunk ${totalChunks})`)
    
    let logs
    try {
      logs = await publicClient.getLogs({
        address: BETLEY_ADDRESS,
        events: BETLEY_EVENTS_ABI,
        fromBlock: currentFromBlock,
        toBlock: currentToBlock
      })
      
      console.log(`✅ Found ${logs.length} logs in range ${currentFromBlock}-${currentToBlock}`)
      successfulChunks++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error fetching logs for range ${currentFromBlock}-${currentToBlock}:`, errorMessage)
      
      // Track failed range for reporting
      failedRanges.push({
        from: currentFromBlock,
        to: currentToBlock,
        error: errorMessage
      })
      
      // Skip this range and continue with next
      currentFromBlock = currentToBlock + BigInt(1)
      continue
    }

    const processedLogs = logs.map(log => {
      const { eventName, args } = log
      
      if (eventName === 'BetCreated') {
        return {
          type: 'BetCreated' as const,
          betId: Number(args.betId),
          creator: args.creator,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        }
      } else if (eventName === 'BetPlaced') {
        return {
          type: 'BetPlaced' as const,
          betId: Number(args.betId),
          user: args.user,
          amount: args.amount,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        }
      }
      
      throw new Error(`Unknown event: ${eventName}`)
    })
    
    allLogs.push(...processedLogs)
    currentFromBlock = currentToBlock + BigInt(1)
  }
  
  // Log processing summary
  console.log(`=== BLOCKCHAIN EVENT PROCESSING SUMMARY ===`)
  console.log(`Total chunks: ${totalChunks}`)
  console.log(`Successful chunks: ${successfulChunks}`)
  console.log(`Failed chunks: ${failedRanges.length}`)
  console.log(`Total events found: ${allLogs.length}`)
  
  if (failedRanges.length > 0) {
    console.log(`Failed ranges:`)
    failedRanges.forEach((range, index) => {
      console.log(`  ${index + 1}. Blocks ${range.from}-${range.to}: ${range.error}`)
    })
  }
  
  // If we have some successful chunks, continue with partial data
  // Only throw error if ALL chunks failed
  if (successfulChunks === 0 && totalChunks > 0) {
    throw new Error(`All ${totalChunks} chunks failed to process. Last error: ${failedRanges[failedRanges.length - 1]?.error}`)
  }
  
  return allLogs
}

// ✅ FIXED: Use admin client internally, no parameters
export async function getLastProcessedBlock(): Promise<bigint> {
  console.log('=== BLOCK INITIALIZATION DEBUG ===')
  
  const supabaseAdmin = createServerSupabaseClient()
  
  const { data, error } = await supabaseAdmin
    .from('stats_processing')
    .select('last_processed_block')
    .single()
  
  if (error) {
    console.error('Database query error:', error)
    throw error
  }
  
  console.log('Raw database value:', data.last_processed_block)
  const lastProcessedBlock = BigInt(data.last_processed_block)
  console.log('Converted to BigInt:', lastProcessedBlock)
  console.log('Is less than 1000?', lastProcessedBlock < BigInt(1000))
  
  // If this is the first run (block 0 or very low), initialize to recent block
  if (lastProcessedBlock < BigInt(1000)) {
    console.log(`Last processed block is ${lastProcessedBlock}, initializing to recent block`)
    
    try {
      // Get current block and start from 1000 blocks ago for safety
      console.log('Attempting to get current block number from RPC...')
      const currentBlock = await publicClient.getBlockNumber()
      console.log('Current block from RPC:', currentBlock)
      
      const recentBlock = currentBlock - BigInt(1000)
      console.log('Calculated recent block:', recentBlock)
      
      // Update the database with the recent block
      console.log('Attempting to update database...')
      await updateLastProcessedBlock(recentBlock)
      
      // Verify the database update actually worked
      const { data: verification, error: verifyError } = await supabaseAdmin
        .from('stats_processing')
        .select('last_processed_block')
        .single()
      
      if (verifyError) {
        console.error('Database verification error:', verifyError)
        throw verifyError
      }
      
      console.log('Database after update:', verification.last_processed_block)
      console.log('Update successful:', BigInt(verification.last_processed_block) === recentBlock)
      
      return recentBlock
      
    } catch (rpcError) {
      console.error('RPC call failed during initialization:', rpcError)
      
      // Fallback: Use a reasonable recent block number
      console.log('Using fallback block number due to RPC failure')
      const fallbackBlock = BigInt(9926000) // Conservative fallback
      
      try {
        await updateLastProcessedBlock(fallbackBlock)
        console.log('Fallback block set successfully:', fallbackBlock)
        return fallbackBlock
      } catch (dbError) {
        console.error('Database update failed even with fallback:', dbError)
        throw new Error(`Both RPC and database operations failed: RPC=${rpcError.message}, DB=${dbError.message}`)
      }
    }
  }
  
  console.log('Using existing last_processed_block:', lastProcessedBlock)
  return lastProcessedBlock
}

// Use admin client internally, no parameters
export async function updateLastProcessedBlock(blockNumber: bigint): Promise<void> {
  const supabaseAdmin = createServerSupabaseClient()
  
  const { error } = await supabaseAdmin
    .from('stats_processing')
    .update({
      last_processed_block: Number(blockNumber),
      last_processed_at: new Date().toISOString(),
      processing_status: 'idle'
    })
    .eq('id', 1)
  
  if (error) throw error
}