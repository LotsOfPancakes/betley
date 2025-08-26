import { http, fallback } from 'viem'
import { baseSepolia, base } from 'viem/chains'
import { baseSepolia as appKitBaseSepolia, base as appKitBase } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Zero address constant for native ETH betting
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// Environment variable helpers (kept for dev settings)
function getOptionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

function getNumericEnv(key: string, fallback: number): number {
  const value = process.env[key]
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

function getBooleanEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key]
  if (!value) return fallback
  return value.toLowerCase() === 'true'
}

// Environment-based network configuration
// Production = Base Mainnet, Development = Base Sepolia
const isProduction = process.env.NODE_ENV === 'production'

// Helper function to create AppKit network with custom RPC URLs
const createAppKitNetworkConfig = (baseNetwork: AppKitNetwork, customRpcUrls: string[]): AppKitNetwork => {
  return {
    ...baseNetwork,
    rpcUrls: {
      ...baseNetwork.rpcUrls,
      default: {
        http: customRpcUrls
      }
    }
  } as AppKitNetwork
}

// Define network configurations with all layer-specific objects
const MAINNET_CONFIG = {
  // Wagmi/General configuration
  chainId: 8453,
  name: 'Base Mainnet',
  isTestnet: false,
  explorerUrl: 'https://basescan.org',
  
  // RPC URLs (shared by all layers)
  rpcUrls: [
    'https://base.drpc.org',
    'https://base.blockpi.network/v1/rpc/public',
    'https://base-rpc.publicnode.com',
    'https://mainnet.base.org'
  ],
  
  // Viem-specific chain object
  viemChain: base,
  
  // AppKit-specific network object
  appKitNetwork: createAppKitNetworkConfig(appKitBase, [
    'https://base.drpc.org',
    'https://base.blockpi.network/v1/rpc/public',
    'https://base-rpc.publicnode.com',
    'https://mainnet.base.org'
  ]),
}

const TESTNET_CONFIG = {
  // Wagmi/General configuration
  chainId: 84532,
  name: 'Base Sepolia',
  isTestnet: true,
  explorerUrl: 'https://sepolia.basescan.org',
  
  // RPC URLs (shared by all layers)
  rpcUrls: [
    'https://base-sepolia.api.onfinality.io/public',
    'https://sepolia.base.org',
    'https://base-sepolia-rpc.publicnode.com',
    'https://base-sepolia.blockpi.network/v1/rpc/public'
  ],
  
  // Viem-specific chain object
  viemChain: baseSepolia,
  
  // AppKit-specific network object
  appKitNetwork: createAppKitNetworkConfig(appKitBaseSepolia, [
    'https://base-sepolia.api.onfinality.io/public',
    'https://sepolia.base.org',
    'https://base-sepolia-rpc.publicnode.com',
    'https://base-sepolia.blockpi.network/v1/rpc/public'
  ]),
}

// Contract addresses for each network
const MAINNET_CONTRACTS = {
  betley: '0xc43d8ff912abcb7bab8abc61cacd11b0c630dd9d' as `0x${string}`,
  mockERC20: ZERO_ADDRESS as `0x${string}`,
}

const TESTNET_CONTRACTS = {
  betley: '0xEb8a61BE50da162A01cCce1e5633bB3c21A13aBC' as `0x${string}`,
  mockERC20: ZERO_ADDRESS as `0x${string}`,
}

// Centralized configuration object
export const config = {
  network: isProduction ? MAINNET_CONFIG : TESTNET_CONFIG,
  contracts: isProduction ? MAINNET_CONTRACTS : TESTNET_CONTRACTS,
  
  app: {
    name: getOptionalEnv('NEXT_PUBLIC_APP_NAME', 'Betley'),
    description: getOptionalEnv(
      'NEXT_PUBLIC_APP_DESCRIPTION', 
      'Decentralized betting platform'
    ),
    url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'https://www.betley.xyz'),
  },
  
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  },
  
  timeouts: {
    // Approval timeout: 8s for testnet, 5s for mainnet
    approval: getNumericEnv(
      'NEXT_PUBLIC_APPROVAL_TIMEOUT',
      isProduction ? 5000 : 8000
    ),
    // React Query stale time
    queryStale: getNumericEnv('NEXT_PUBLIC_QUERY_STALE_TIME', 30000),
    // React Query refetch interval
    queryRefetch: getNumericEnv('NEXT_PUBLIC_QUERY_REFETCH_INTERVAL', 8000),
    // Mutation retry count
    mutationRetry: getNumericEnv('NEXT_PUBLIC_MUTATION_RETRY', 3),
  },
  
  dev: {
    enableDevtools: getBooleanEnv('NEXT_PUBLIC_ENABLE_DEVTOOLS', process.env.NODE_ENV === 'development'),
    enableConsoleLogging: getBooleanEnv('NEXT_PUBLIC_ENABLE_CONSOLE_LOGGING', process.env.NODE_ENV === 'development'),
  },
}

// Export individual configs for convenience
export const networkConfig = config.network
export const contractsConfig = config.contracts
export const appConfig = config.app
export const walletConnectConfig = config.walletConnect
export const timeoutsConfig = config.timeouts
export const devConfig = config.dev

// Validation function to ensure config is valid
export function validateConfig(): void {
  // Validate WalletConnect Project ID
  if (!config.walletConnect.projectId) {
    throw new Error('NEXT_PUBLIC_PROJECT_ID environment variable is required')
  }
  
  // Validate contract addresses
  if (!config.contracts.betley.startsWith('0x') || config.contracts.betley.length !== 42) {
    throw new Error('Invalid Betley contract address')
  }
  
  if (!config.contracts.mockERC20.startsWith('0x') || config.contracts.mockERC20.length !== 42) {
    throw new Error('Invalid mockERC20 token address')
  }
  
  // Validate network configuration
  if (config.network.chainId <= 0) {
    throw new Error('Invalid chain ID')
  }
  
  // Validate RPC URLs array
  if (!Array.isArray(config.network.rpcUrls) || config.network.rpcUrls.length === 0) {
    throw new Error('Invalid RPC URLs - must be non-empty array')
  }
  
  for (const [index, rpcUrl] of config.network.rpcUrls.entries()) {
    if (!rpcUrl || !rpcUrl.startsWith('http')) {
      throw new Error(`Invalid RPC URL at index ${index}: ${rpcUrl}`)
    }
  }
  
  // Validate timeouts - silent validation (no console warnings)
  // If timeouts are problematic, they'll surface through user experience
  // rather than console noise in production
}

// Environment detection helpers
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTestnet = config.network.isTestnet
// Note: isProduction is already defined above

// Configuration debug logging (development only)
// Only log if explicitly enabled and in development
if (isDevelopment && config.dev.enableConsoleLogging) {
  // Silent in production - configuration loads without debug noise
}

// Shared fallback transport utility
export const createFallbackTransport = () => {
  return fallback([
    http(config.network.rpcUrls[0], { 
      timeout: 5000, 
      retryCount: 2 
    }),
    http(config.network.rpcUrls[1], { 
      timeout: 8000, 
      retryCount: 3 
    }),
    http(config.network.rpcUrls[2], { 
      timeout: 10000, 
      retryCount: 1 
    }),
    http(config.network.rpcUrls[3], { 
      timeout: 10000, 
      retryCount: 1 
    })
  ], {
    rank: false,
    retryCount: 2,
    retryDelay: 1000
  })
}

// Run validation on load
try {
  validateConfig()
} catch (error) {
  console.error('❌ Configuration validation failed:', error)
  if (isProduction) {
    throw error // Fail fast in production
  }
}