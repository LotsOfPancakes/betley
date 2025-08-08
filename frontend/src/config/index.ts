import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from environment variables
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [baseSepolia] as [AppKitNetwork, ...AppKitNetwork[]]

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