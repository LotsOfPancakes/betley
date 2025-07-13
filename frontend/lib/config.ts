// frontend/lib/config.ts
// Centralized configuration for all environment-dependent values

export interface AppConfig {
  // Network Configuration
  network: {
    chainId: number
    rpcUrl: string
    explorerUrl: string
    name: string
    isTestnet: boolean
  }
  
  // Contract Addresses
  contracts: {
    betley: `0x${string}`
    hypeToken: `0x${string}`
  }
  
  // App Configuration
  app: {
    name: string
    description: string
    url: string
  }
  
  // WalletConnect Configuration
  walletConnect: {
    projectId: string
  }
  
  // Timing Configuration (in milliseconds)
  timeouts: {
    approval: number
    queryStale: number
    queryRefetch: number
    mutationRetry: number
  }
  
  // Development flags
  dev: {
    enableDevtools: boolean
    enableConsoleLogging: boolean
  }
}

// Helper function to validate required environment variables
function getRequiredEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Helper function to get optional environment variables with defaults
function getOptionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

// Helper function to get boolean environment variables
function getBooleanEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key]
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true'
}

// Helper function to get numeric environment variables
function getNumericEnv(key: string, fallback: number): number {
  const value = process.env[key]
  if (value === undefined) return fallback
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    console.warn(`Invalid numeric value for ${key}: ${value}, using fallback: ${fallback}`)
    return fallback
  }
  return parsed
}

// Create the configuration object
export const config: AppConfig = {
  network: {
    chainId: getNumericEnv('NEXT_PUBLIC_CHAIN_ID', 998),
    rpcUrl: getRequiredEnv(
      'NEXT_PUBLIC_RPC_URL', 
      'https://rpc.hyperliquid-testnet.xyz/evm'
    ),
    explorerUrl: getOptionalEnv(
      'NEXT_PUBLIC_EXPLORER_URL', 
      getBooleanEnv('NEXT_PUBLIC_IS_TESTNET', true) 
        ? 'https://explorer.hyperliquid-testnet.xyz'
        : 'https://hyperevmscan.io/'
    ),
    name: getOptionalEnv('NEXT_PUBLIC_NETWORK_NAME', 'HyperEVM Testnet'),
    isTestnet: getBooleanEnv('NEXT_PUBLIC_IS_TESTNET', true),
  },
  
  contracts: {
    betley: getRequiredEnv(
      'NEXT_PUBLIC_BETLEY_ADDRESS', 
      '0xCFf7b01Fe9838a913C2Bc06499C3CBEA169D1725'
    ) as `0x${string}`,
    hypeToken: getRequiredEnv(
      'NEXT_PUBLIC_HYPE_TOKEN_ADDRESS', 
      '0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C'
    ) as `0x${string}`, // Mock HYPE test token
  },
  
  app: {
    name: getOptionalEnv('NEXT_PUBLIC_APP_NAME', 'Betley'),
    description: getOptionalEnv(
      'NEXT_PUBLIC_APP_DESCRIPTION', 
      'Decentralized betting platform'
    ),
    url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
  
  walletConnect: {
    projectId: getRequiredEnv(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 
      'a7b53d050fbc92b0e503d20e293d6ff5'
    ),
  },
  
  timeouts: {
    // Approval timeout: 8s for testnet, 5s for mainnet
    approval: getNumericEnv(
      'NEXT_PUBLIC_APPROVAL_TIMEOUT',
      getBooleanEnv('NEXT_PUBLIC_IS_TESTNET', true) ? 8000 : 5000
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
  // Validate contract addresses
  if (!config.contracts.betley.startsWith('0x') || config.contracts.betley.length !== 42) {
    throw new Error('Invalid Betley contract address')
  }
  
  if (!config.contracts.hypeToken.startsWith('0x') || config.contracts.hypeToken.length !== 42) {
    throw new Error('Invalid HYPE token address')
  }
  
  // Validate network configuration
  if (config.network.chainId <= 0) {
    throw new Error('Invalid chain ID')
  }
  
  if (!config.network.rpcUrl.startsWith('http')) {
    throw new Error('Invalid RPC URL')
  }
  
  // Validate timeouts
  if (config.timeouts.approval < 1000) {
    console.warn('Approval timeout is very low, this may cause issues')
  }
  
  if (config.timeouts.approval > 30000) {
    console.warn('Approval timeout is very high, this may impact UX')
  }
}

// Environment detection helpers
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTestnet = config.network.isTestnet

// Debug logging (only in development)
if (isDevelopment && config.dev.enableConsoleLogging) {
  console.log('🔧 Betley Configuration Loaded:', {
    network: config.network.name,
    chainId: config.network.chainId,
    isTestnet: config.network.isTestnet,
    contracts: {
      betley: config.contracts.betley,
      hypeToken: config.contracts.hypeToken,
    },
    timeouts: config.timeouts,
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

// Add this debug section at the very end of the file, after the existing debug logging
console.log('🔧 Raw Environment Variables:', {
  BETLEY_ADDRESS: process.env.NEXT_PUBLIC_BETLEY_ADDRESS,
  HYPE_ADDRESS: process.env.NEXT_PUBLIC_HYPE_TOKEN_ADDRESS,
  IS_TESTNET: process.env.NEXT_PUBLIC_IS_TESTNET,
});