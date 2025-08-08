// Reown AppKit Configuration for Betley - Updated with Best Practices
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
// Import config, networks, projectId, and wagmiAdapter from our config file
import { config, networks, projectId, wagmiAdapter } from '@/config'
// Import the default network separately if needed
import { baseSepolia } from '@/lib/chains'

const metadata = {
  name: appConfig.name,
  description: appConfig.description,
  url: appConfig.url,
  icons: ['https://www.betley.xyz/images/betley-logo-128.png']
}

// Initialize AppKit *outside* the component render cycle
// Add a check for projectId for type safety, although config throws error already.
if (!projectId) {
  console.error("AppKit Initialization Error: Project ID is missing.");
  // Optionally throw an error or render fallback UI
} else {
  createAppKit({
    adapters: [wagmiAdapter],
    // Use non-null assertion `!` as projectId is checked runtime, needed for TypeScript
    projectId: projectId!,
    // Pass networks directly (type is now correctly inferred from config)
    networks: networks,
    defaultNetwork: baseSepolia, // Or your preferred default
    metadata,
    features: { 
      analytics: devConfig.enableDevtools, // Optional analytics
      email: true,                    // Enable email signup
      socials: ['google', 'apple', 'x', 'discord'], // Enable social login
      onramp: false, // disable buying crypto
      swaps: false, // Disable swaps
    },
    themeMode: 'dark',               // Match your app's dark theme
    themeVariables: {
      '--w3m-accent': '#10b981',     // Green accent to match your brand
      '--w3m-border-radius-master': '12px'
    }
  })
}

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

  // Calculate initial state for Wagmi SSR hydration
  const initialState = cookieToInitialState(config as Config, cookies)

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
    // Cast config as Config for WagmiProvider
    <WagmiProvider config={config as Config} initialState={initialState}>
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