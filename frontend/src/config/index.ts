import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { config as appConfig } from '../lib/config'

// Get projectId from environment variables
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create Base Sepolia network with fallback RPC URLs
const baseSepoliaWithFallback = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: appConfig.network.rpcUrls
    }
  }
} as AppKitNetwork

export const networks = [baseSepoliaWithFallback] as [AppKitNetwork, ...AppKitNetwork[]]

// Set up the Wagmi Adapter (Config) with cookie storage for SSR
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig