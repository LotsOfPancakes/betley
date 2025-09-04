'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { config } from '@/lib/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { WalletAuthProvider } from '@/lib/auth/WalletAuthContext'

// Set up queryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 5,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Set up metadata
const metadata = {
  name: 'Betley',
  description: 'Easiest way to set up an on-chain bet on anything',
  url: config.app.url,
  icons: [`${config.app.url}/images/betley-logo-128.png`]
}

// Validate project ID before creating AppKit
if (!projectId) {
  console.error('AppKit initialization failed: NEXT_PUBLIC_PROJECT_ID is missing', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    available_env_vars: Object.keys(process.env).filter(k => k.includes('PROJECT')).sort()
  })
  throw new Error('NEXT_PUBLIC_PROJECT_ID environment variable is required for AppKit initialization')
}

// Create the modal - this is where createAppKit should be called
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  
  // Smart network handling - prevents blocking users before wallet connection
  defaultNetwork: config.network.appKitNetwork,    // Default to Base/Base Sepolia
  allowUnsupportedChain: true,                      // Don't block unknown networks
  enableNetworkSwitch: true,                        // Allow switching (default: true)
  
  features: {
    email: true,                    // Enable email signup
    socials: ['google', 'apple', 'x', 'discord'], // Enable social login
    analytics: true,                // Enable analytics
    onramp: false,                  // Disable buying crypto
    swaps: false,                   // Disable swaps
  },
  themeMode: 'dark',               // Match app's dark theme
  themeVariables: {
    '--w3m-accent': '#10b981',     // Green accent to match brand
    '--w3m-border-radius-master': '12px',
    // Font customization to match site's Geist Sans
    '--w3m-font-family': 'var(--font-geist-sans), system-ui, sans-serif',
    '--w3m-font-size-master': '14px'
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <WalletAuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </WalletAuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider