'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
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
      retry: 1,
    },
  },
})

// Set up metadata
const metadata = {
  name: 'Betley',
  description: 'Easiest way to set up an on-chain bet on anything',
  url: 'https://www.betley.xyz',
  icons: ['https://www.betley.xyz/images/betley-logo-128.png']
}

// Create the modal - this is where createAppKit should be called
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks,
  metadata,
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
    '--w3m-border-radius-master': '12px'
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