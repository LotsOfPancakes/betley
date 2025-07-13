// frontend/lib/chains.ts
import { defineChain } from 'viem'
import { networkConfig } from './config'

export const hyperevm = defineChain({
  id: networkConfig.chainId,
  name: networkConfig.name,
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet HYPE',
    symbol: 'HYPE',
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