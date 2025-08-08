// Reown AppKit Configuration for Betley - Fixed SSR Hydration
// File: frontend/app/providers.tsx

'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { 
  appConfig, 
  timeoutsConfig, 
  devConfig 
} from '@/lib/config'
// Import factory function and constants from our config file
import { getConfig, networks, projectId } from '@/config'
// Import the default network separately if needed
import { baseSepolia } from '@/lib/chains'

const metadata = {
  name: appConfig.name,
  description: appConfig.description,
  url: appConfig.url,
  icons: ['https://www.betley.xyz/images/betley-logo-128.png']
}

export function Providers({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null // Cookies from server for hydration
}) {
  const [mounted, setMounted] = useState(false)
  
  // ✅ Create fresh config instance following official best practices
  const [{ wagmiAdapter, config }] = useState(() => getConfig())
  
  // ✅ Initialize AppKit with fresh wagmiAdapter instance
  useState(() => {
    if (!projectId) {
      console.error("AppKit Initialization Error: Project ID is missing.");
      return null
    }
    
    return createAppKit({
      adapters: [wagmiAdapter],
      projectId: projectId!,
      networks: networks,
      defaultNetwork: baseSepolia,
      metadata,
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
  })

  // ✅ Handle client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Calculate initial state for Wagmi SSR hydration with fresh config
  const initialState = cookieToInitialState(config, cookies)

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
    // ✅ No type casting needed - fresh config has correct types
    <WagmiProvider config={config} initialState={initialState}>
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