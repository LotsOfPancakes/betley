// frontend/app/providers.tsx - Final fix for WalletConnect initialization
'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { hyperevm } from '@/lib/chains'
import { useState, useRef } from 'react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { 
  networkConfig, 
  appConfig, 
  walletConnectConfig, 
  timeoutsConfig, 
  devConfig 
} from '@/lib/config'

export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ FINAL FIX: Use useRef to ensure config is only created once per component instance
  const configRef = useRef<ReturnType<typeof createConfig> | null>(null)
  
  if (!configRef.current) {
    configRef.current = createConfig(
      getDefaultConfig({
        chains: [hyperevm],
        transports: {
          [hyperevm.id]: http(networkConfig.rpcUrl),
        },
        walletConnectProjectId: walletConnectConfig.projectId,
        appName: appConfig.name,
        appDescription: appConfig.description,
        appUrl: appConfig.url,
      })
    )
  }

  // Create optimized QueryClient with configurable timeouts
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Use configurable stale time
        staleTime: timeoutsConfig.queryStale,
        // Data stays in cache for 5 minutes after component unmounts
        gcTime: 5 * 60 * 1000,
        // Use configurable retry count
        retry: timeoutsConfig.mutationRetry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus by default (can override per query)
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  }))

  return (
    <WagmiProvider config={configRef.current}>
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
              "--ck-connectbutton-color": "#FFFFFF",
              "--ck-connectbutton-hover-background": "#374151",
              "--ck-primary-button-background": "#2563EB",
              "--ck-primary-button-hover-background": "#1D4ED8",
              "--ck-secondary-button-background": "#374151",
              "--ck-secondary-button-hover-background": "#4B5563",
              "--ck-modal-background": "#111827",
              "--ck-body-background": "#1F2937",
              "--ck-body-background-secondary": "#111827",
              "--ck-body-background-tertiary": "#374151",
              "--ck-body-color": "#F3F4F6",
              "--ck-body-color-muted": "#9CA3AF",
              "--ck-body-color-muted-hover": "#D1D5DB",
            }}
            options={{
              initialChainId: networkConfig.chainId,
              enforceSupportedChains: false,
            }}
          >
            {children}
          </ConnectKitProvider>
          {/* React Query DevTools - configurable visibility */}
          {devConfig.enableDevtools && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}