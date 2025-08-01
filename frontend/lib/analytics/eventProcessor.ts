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
  const MAX_BLOCK_RANGE = 1000n
  const allLogs: ProcessedEvent[] = []
  
  let currentFromBlock = fromBlock
  
  while (currentFromBlock <= toBlock) {
    const currentToBlock = currentFromBlock + MAX_BLOCK_RANGE - 1n > toBlock 
      ? toBlock 
      : currentFromBlock + MAX_BLOCK_RANGE - 1n
    
    console.log(`Fetching events from block ${currentFromBlock} to ${currentToBlock}`)
    
    const logs = await publicClient.getLogs({
      address: BETLEY_ADDRESS,
      events: BETLEY_EVENTS_ABI,
      fromBlock: currentFromBlock,
      toBlock: currentToBlock
    })

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
    currentFromBlock = currentToBlock + 1n
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
  return BigInt(data.last_processed_block)
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