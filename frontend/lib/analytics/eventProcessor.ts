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
  
  let currentFromBlock = fromBlock
  
  while (currentFromBlock <= toBlock) {
    const currentToBlock = currentFromBlock + MAX_BLOCK_RANGE - BigInt(1) > toBlock 
      ? toBlock 
      : currentFromBlock + MAX_BLOCK_RANGE - BigInt(1)
    
    console.log(`Fetching events from block ${currentFromBlock} to ${currentToBlock}`)
    
    let logs
    try {
      logs = await publicClient.getLogs({
        address: BETLEY_ADDRESS,
        events: BETLEY_EVENTS_ABI,
        fromBlock: currentFromBlock,
        toBlock: currentToBlock
      })
      
      console.log(`Found ${logs.length} logs in range ${currentFromBlock}-${currentToBlock}`)
    } catch (error) {
      console.error(`Error fetching logs for range ${currentFromBlock}-${currentToBlock}:`, error)
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
  
  return allLogs
}

// ✅ FIXED: Use admin client internally, no parameters
export async function getLastProcessedBlock(): Promise<bigint> {
  const supabaseAdmin = createServerSupabaseClient()
  
  const { data, error } = await supabaseAdmin
    .from('stats_processing')
    .select('last_processed_block')
    .single()
  
  if (error) throw error
  
  const lastProcessedBlock = BigInt(data.last_processed_block)
  
  // If this is the first run (block 0 or very low), initialize to recent block
  if (lastProcessedBlock < BigInt(1000)) {
    console.log(`Last processed block is ${lastProcessedBlock}, initializing to recent block`)
    
    // Get current block and start from 1000 blocks ago for safety
    const currentBlock = await publicClient.getBlockNumber()
    const recentBlock = currentBlock - BigInt(1000)
    
    console.log(`Initializing last_processed_block to ${recentBlock} (current: ${currentBlock})`)
    
    // Update the database with the recent block
    await updateLastProcessedBlock(recentBlock)
    return recentBlock
  }
  
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