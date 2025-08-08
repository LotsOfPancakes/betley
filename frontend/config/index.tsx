// config/index.tsx - Reown AppKit Configuration (Fixed for proper SSR hydration)
import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@/lib/chains'
import type { Chain } from 'viem'

// Read Project ID from environment variables
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Ensure Project ID is defined at build time
if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined. Please set it in .env.local')
}

// Define supported networks, explicitly typed as a non-empty array of Chains
export const networks: [Chain, ...Chain[]] = [baseSepolia]

// Factory function to create fresh config instances (following official best practices)
export function getConfig() {
  // Ensure projectId is defined at runtime
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined. Please set it in .env.local')
  }
  
  const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({ storage: cookieStorage }), // Use cookieStorage for SSR
    ssr: true, // Enable SSR support
    projectId: projectId!, // Use non-null assertion since we checked above
    networks, // Pass the explicitly typed networks array
  })
  
  return {
    wagmiAdapter,
    config: wagmiAdapter.wagmiConfig
  }
}