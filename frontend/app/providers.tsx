// Reown AppKit Configuration for Betley
// File: frontend/app/providers.tsx

'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { hyperevm } from '@/lib/chains'
import { useState, useEffect } from 'react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { 
  appConfig, 
  walletConnectConfig, 
  timeoutsConfig, 
  devConfig 
} from '@/lib/config'

// ✅ Create Wagmi Adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: [hyperevm],
  projectId: walletConnectConfig.projectId,
  ssr: true
})

// ✅ Create AppKit with email and social login support
createAppKit({
  adapters: [wagmiAdapter],
  networks: [hyperevm],
  projectId: walletConnectConfig.projectId,
  metadata: {
    name: appConfig.name,
    description: appConfig.description,
    url: appConfig.url,
    icons: ['https://betley.vercel.app/images/betley-logo-128.png']
  },
  features: {
    email: true,                    // Enable email signup
    socials: ['google', 'apple', 'x', 'discord'], // Enable social login
    analytics: devConfig.enableDevtools, // Optional analytics
    onramp: false, // disable buying crypto
    swaps: false, // Disable swaps
  },
  themeMode: 'dark',               // Match your app's dark theme
  themeVariables: {
    '--w3m-accent': '#10b981',     // Green accent to match your brand
    '--w3m-border-radius-master': '12px'
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // ✅ Handle client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

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
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
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