// frontend/lib/chains.ts
import { defineChain } from 'viem'
import { networkConfig } from './config'

export const baseSepolia = defineChain({
  id: networkConfig.chainId,
  name: networkConfig.name,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [networkConfig.rpcUrl],
    },
  },
  blockExplorers: {
    default: { 
      name: `${networkConfig.name} Explorer`, 
      url: networkConfig.explorerUrl
    },
  },
  testnet: networkConfig.isTestnet,
})