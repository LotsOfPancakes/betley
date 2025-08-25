import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, optimism, avalanche } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { config as appConfig } from '../lib/config'

// Get projectId from centralized config
export const projectId = appConfig.walletConnect.projectId

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Multi-network configuration to prevent blocking users before wallet connection
export const networks = [
  appConfig.network.appKitNetwork,  // Base/Base Sepolia (primary)
  mainnet,                          // Ethereum mainnet  
  polygon,                          // Polygon
  arbitrum,                         // Arbitrum
  optimism,                         // Optimism  
  avalanche,                        // Avalanche
] as [AppKitNetwork, ...AppKitNetwork[]]

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