'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { hyperevm } from '@/lib/chains'

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

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </WagmiProvider>
  )
}