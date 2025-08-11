'use client'

// Environment variable helpers
function getRequiredEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

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

// Centralized configuration object
export const config = {
  network: {
    chainId: getNumericEnv('NEXT_PUBLIC_CHAIN_ID', 84532),
    rpcUrl: getRequiredEnv(
      'NEXT_PUBLIC_RPC_URL', 
      'https://base-sepolia.api.onfinality.io/public'
    ),
    explorerUrl: getOptionalEnv(
      'NEXT_PUBLIC_EXPLORER_URL',
      getBooleanEnv('NEXT_PUBLIC_IS_TESTNET', true) 
        ? 'https://sepolia.basescan.org'
        : 'https://basescan.org'
    ),
    name: getOptionalEnv('NEXT_PUBLIC_NETWORK_NAME', 'Base Sepolia'),
    isTestnet: getBooleanEnv('NEXT_PUBLIC_IS_TESTNET', true),
  },
  
  contracts: {
    betley: getRequiredEnv(
      'NEXT_PUBLIC_BETLEY_ADDRESS',
      '0xF19644783E32fB9BDF6B09B37BE009C6FaEf67D0'
    ) as `0x${string}`,
    mockERC20: getOptionalEnv(
      'NEXT_PUBLIC_MOCKERC20_TOKEN_ADDRESS', // Placeholder for native ETH betting
      '0x0000000000000000000000000000000000000000'
    ) as `0x${string}`,
  },
  
  app: {
    name: getOptionalEnv('NEXT_PUBLIC_APP_NAME', 'Betley'),
    description: getOptionalEnv(
      'NEXT_PUBLIC_APP_DESCRIPTION', 
      'Decentralized betting platform'
    ),
    url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'https://www.betley.xyz'),
  },
  
  walletConnect: {
    projectId: getOptionalEnv(
      'NEXT_PUBLIC_PROJECT_ID', 
      '3631ce78fe91dacd79be36cf1db10400'
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
  
  if (!config.contracts.mockERC20.startsWith('0x') || config.contracts.mockERC20.length !== 42) {
    throw new Error('Invalid mockERC20 token address')
  }
  
  // Validate network configuration
  if (config.network.chainId <= 0) {
    throw new Error('Invalid chain ID')
  }
  
  if (!config.network.rpcUrl.startsWith('http')) {
    throw new Error('Invalid RPC URL')
  }
  
  // Validate timeouts - silent validation (no console warnings)
  // If timeouts are problematic, they'll surface through user experience
  // rather than console noise in production
}

// Environment detection helpers
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTestnet = config.network.isTestnet

// Configuration debug logging (development only)
// Only log if explicitly enabled and in development
if (isDevelopment && config.dev.enableConsoleLogging) {
  // Silent in production - configuration loads without debug noise
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