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

// Sleep function for rate limiting
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getBlockchainEvents(
  fromBlock: bigint,
  toBlock: bigint,
  delayMs: number = 0
): Promise<ProcessedEvent[]> {
  // Validate inputs
  if (fromBlock > toBlock) {
    throw new Error(`Invalid block range: fromBlock (${fromBlock}) > toBlock (${toBlock})`)
  }
  
  if (fromBlock < BigInt(1)) {
    console.log(`Adjusting fromBlock from ${fromBlock} to 1`)
    fromBlock = BigInt(1)
  }
  
  const MAX_BLOCK_RANGE = BigInt(500)  // Reduced from 1000 for better rate limiting
  const allLogs: ProcessedEvent[] = []
  const failedRanges: Array<{from: bigint, to: bigint, error: string}> = []
  let successfulChunks = 0
  let totalChunks = 0
  
  let currentFromBlock = fromBlock
  
  console.log(`🔄 Processing with ${delayMs}ms delays between RPC calls`)
  
  while (currentFromBlock <= toBlock) {
    const currentToBlock = currentFromBlock + MAX_BLOCK_RANGE - BigInt(1) > toBlock 
      ? toBlock 
      : currentFromBlock + MAX_BLOCK_RANGE - BigInt(1)
    
    totalChunks++
    console.log(`Fetching events from block ${currentFromBlock} to ${currentToBlock} (chunk ${totalChunks})`)
    
    let logs: Awaited<ReturnType<typeof publicClient.getLogs>> = []
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        logs = await publicClient.getLogs({
          address: BETLEY_ADDRESS,
          events: BETLEY_EVENTS_ABI,
          fromBlock: currentFromBlock,
          toBlock: currentToBlock
        })
        
        console.log(`✅ Found ${logs.length} logs in range ${currentFromBlock}-${currentToBlock}`)
        successfulChunks++
        break // Success, exit retry loop
        
      } catch (error) {
        retryCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const isRateLimit = errorMessage.toLowerCase().includes('rate limit') || 
                           errorMessage.includes('429') || 
                           errorMessage.includes('too many requests')
        
        if (isRateLimit) {
          console.log(`🚫 Rate limited (attempt ${retryCount}/${maxRetries}): ${errorMessage}`)
        } else {
          console.error(`❌ Error fetching logs (attempt ${retryCount}/${maxRetries}): ${errorMessage}`)
        }
        
        if (retryCount < maxRetries) {
          // Exponential backoff with longer delays for rate limits
          const baseDelay = isRateLimit ? delayMs * 3 : delayMs
          const backoffDelay = baseDelay * Math.pow(2, retryCount - 1)
          console.log(`⏳ Retrying in ${backoffDelay}ms...`)
          await sleep(backoffDelay)
        } else {
          // Max retries exceeded, track as failed
          console.error(`💥 Max retries exceeded for range ${currentFromBlock}-${currentToBlock}`)
          failedRanges.push({
            from: currentFromBlock,
            to: currentToBlock,
            error: errorMessage
          })
          logs = [] // Set empty logs to continue processing
          break
        }
      }
    }

    if (logs && logs.length > 0) {
      const processedLogs = logs.map(log => {
        // Type assertion for viem log structure
        const typedLog = log as typeof log & { eventName: string; args: Record<string, unknown> }
        const { eventName, args } = typedLog
        
        if (eventName === 'BetCreated') {
          return {
            type: 'BetCreated' as const,
            betId: Number(args.betId),
            creator: args.creator as string,
            blockNumber: log.blockNumber || BigInt(0),
            transactionHash: log.transactionHash || '0x'
          }
        } else if (eventName === 'BetPlaced') {
          return {
            type: 'BetPlaced' as const,
            betId: Number(args.betId),
            user: args.user as string,
            amount: args.amount as bigint,
            blockNumber: log.blockNumber || BigInt(0),
            transactionHash: log.transactionHash || '0x'
          }
        }
        
        throw new Error(`Unknown event: ${eventName}`)
      })
      
      allLogs.push(...processedLogs)
    }
    
    currentFromBlock = currentToBlock + BigInt(1)
    
    // Rate limiting delay between chunks (except for last chunk)
    if (delayMs > 0 && currentFromBlock <= toBlock) {
      console.log(`⏳ Waiting ${delayMs}ms before next RPC call...`)
      await sleep(delayMs)
    }
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
      
      // Fallback: Calculate a reasonable recent block number based on time
      console.log('Using fallback block number due to RPC failure')
      
      // HyperEVM has ~1 second block time, estimate current block
      // Assume chain started around block 9,000,000 at some point in the past
      // This is a rough estimation - in production you'd want more precise values
      const ESTIMATED_BLOCKS_PER_DAY = 86400 // 1 second per block
      const DAYS_AGO_FALLBACK = 1 // Start from 1 day ago to be safe
      const ROUGH_CURRENT_ESTIMATE = 9950000 // Update this periodically
      
      const fallbackBlock = BigInt(ROUGH_CURRENT_ESTIMATE - (ESTIMATED_BLOCKS_PER_DAY * DAYS_AGO_FALLBACK))
      console.log(`Calculated fallback block: ${fallbackBlock} (estimated current: ${ROUGH_CURRENT_ESTIMATE}, ${DAYS_AGO_FALLBACK} day ago)`)
      
      try {
        await updateLastProcessedBlock(fallbackBlock)
        console.log('Fallback block set successfully:', fallbackBlock)
        return fallbackBlock
      } catch (dbError) {
        console.error('Database update failed even with fallback:', dbError)
        const rpcMsg = rpcError instanceof Error ? rpcError.message : 'Unknown RPC error'
        const dbMsg = dbError instanceof Error ? dbError.message : 'Unknown DB error'
        throw new Error(`Both RPC and database operations failed: RPC=${rpcMsg}, DB=${dbMsg}`)
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