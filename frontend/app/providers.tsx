// frontend/app/providers.tsx
'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { hyperevm } from '@/lib/chains'
import { useState } from 'react'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'

// Use a placeholder project ID if you don't have one yet
const walletConnectProjectId = 'a7b53d050fbc92b0e503d20e293d6ff5'

const config = createConfig(
  getDefaultConfig({
    chains: [hyperevm],
    transports: {
      [hyperevm.id]: http('https://rpc.hyperliquid-testnet.xyz/evm'),
    },
    walletConnectProjectId,
    appName: 'Betley',
    appDescription: 'Decentralized betting platform',
    appUrl: 'http://localhost:3000',
  })
)

export function Providers({ children }: { children: React.ReactNode }) {
  // Create optimized QueryClient with useState to ensure stability
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 30 seconds before automatic refetch
        staleTime: 30 * 1000,
        // Data stays in cache for 5 minutes after component unmounts
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
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
    <WagmiProvider config={config}>
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
              initialChainId: 998,
              enforceSupportedChains: false,
            }}
          >
            {children}
          </ConnectKitProvider>
          {/* React Query DevTools - only shows in development */}
          <ReactQueryDevtools initialIsOpen={false} />
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}