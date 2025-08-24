// ============================================================================
// File: frontend/src/lib/chain.ts  
// Centralized blockchain configuration for consistent network handling
// ============================================================================

import { createPublicClient, http } from 'viem'
import { config } from './config'

// Use centralized chain configuration - no duplicate environment logic
export const currentChain = config.network.viemChain

// Create public client with dynamic configuration and fallback transport
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(config.network.rpcUrls[0], {
    timeout: 10000,
    retryCount: 3
  })
})

// Export chain information for convenience  
export const chainId = currentChain.id
export const isTestnet = config.network.isTestnet
export const rpcUrl = config.network.rpcUrls[0]

// Export contract address from config
export const BETLEY_ADDRESS = config.contracts.betley

// Debug information (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Chain Configuration:', {
    network: currentChain.name,
    chainId: currentChain.id,
    isTestnet,
    rpcUrl,
    contractAddress: BETLEY_ADDRESS
  })
}