import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { config as appConfig } from '../lib/config'

// Get projectId from centralized config
export const projectId = appConfig.walletConnect.projectId

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Use centralized network configuration - no duplicate environment logic
export const networks = [appConfig.network.appKitNetwork] as [typeof appConfig.network.appKitNetwork]

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