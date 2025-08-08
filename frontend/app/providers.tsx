// Reown AppKit Configuration for Betley - Following Official Pattern
// File: frontend/app/providers.tsx

'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { 
  appConfig, 
  timeoutsConfig, 
  devConfig 
} from '@/lib/config'
// Import static wagmiAdapter and constants from our config file
import { wagmiAdapter, projectId } from '@/config'
// Import the default network from AppKit networks
import { baseSepolia } from '@reown/appkit/networks'

// Set up metadata
const metadata = {
  name: appConfig.name,
  description: appConfig.description,
  url: appConfig.url,
  icons: ['https://www.betley.xyz/images/betley-logo-128.png']
}

// Validate project ID
if (!projectId) {
  throw new Error('Project ID is not defined')
}

// ✅ Create AppKit at module level (following official pattern)
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
  defaultNetwork: baseSepolia,
  metadata: metadata,
  features: { 
    analytics: devConfig.enableDevtools,
    email: true,
    socials: ['google', 'apple', 'x', 'discord'],
    onramp: false,
    swaps: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '12px'
  }
})

export function Providers({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null // Cookies from server for hydration
}) {
  const [mounted, setMounted] = useState(false)

  // ✅ Handle client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Calculate initial state for Wagmi SSR hydration
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  // Create optimized QueryClient with configurable timeouts
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: timeoutsConfig.queryStale,
        gcTime: 5 * 60 * 1000,
        retry: 5, // Increased from 3 to 5 for better resilience on unstable testnet
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        refetchOnWindowFocus: true, // Enable refetch when user returns to tab
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  // ✅ Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    // ✅ Use wagmiAdapter.wagmiConfig following official pattern
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
        {devConfig.enableDevtools && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}