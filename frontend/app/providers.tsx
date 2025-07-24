// Properly Fixed providers.tsx with Correct Wagmi v2 Configuration
// File: frontend/app/providers.tsx

'use client'

import { WagmiProvider, createConfig, http, createStorage, cookieStorage } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { hyperevm } from '@/lib/chains'
import { useState, useEffect } from 'react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { 
  networkConfig, 
  appConfig, 
  walletConnectConfig, 
  timeoutsConfig, 
  devConfig 
} from '@/lib/config'

// ✅ Proper Wagmi v2 configuration with state persistence
const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [hyperevm],
    transports: {
      [hyperevm.id]: http(networkConfig.rpcUrl),
    },
    walletConnectProjectId: walletConnectConfig.projectId,
    appName: appConfig.name,
    appDescription: appConfig.description,
    appUrl: appConfig.url,
    // ✅ Proper storage configuration for Wagmi v2
    storage: createStorage({
      storage: typeof window !== 'undefined' ? cookieStorage : undefined,
    }),
    // ✅ Enable SSR support
    ssr: true,
  })
)

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
        retry: timeoutsConfig.mutationRetry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <ConnectKitProvider 
            theme="midnight"
            customTheme={{
              "--ck-font-family": '"Inter", sans-serif',
              "--ck-border-radius": "12px",
              "--ck-connectbutton-font-size": "16px",
              "--ck-connectbutton-border-radius": "8px",
              "--ck-connectbutton-background": "#1F2937",
            }}
          >
            {children}
          </ConnectKitProvider>
        </NotificationProvider>
        {devConfig.enableDevtools && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}