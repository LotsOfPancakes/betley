import { defineChain } from 'viem'

export const hyperevm = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'HyperEVM Explorer', 
      url: 'https://explorer.hyperliquid-testnet.xyz' 
    },
  },
  testnet: true,
})