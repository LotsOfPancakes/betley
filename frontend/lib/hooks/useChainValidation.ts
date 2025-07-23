// frontend/lib/hooks/useChainValidation.ts
import { useAccount, useChainId } from 'wagmi'
import { useNotification } from './useNotification'
import { networkConfig } from '@/lib/config'

/**
 * Hook for validating that the user is on the correct chain before transactions
 * 
 * Usage:
 * const { validateChain } = useChainValidation()
 * if (!validateChain()) return // Don't proceed with transaction
 */
export function useChainValidation() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { showError } = useNotification()

  const validateChain = (): boolean => {
    // If not connected, let the wallet connection flow handle it
    if (!isConnected) {
      return true
    }

    // Check if on correct chain
    if (chainId !== networkConfig.chainId) {
      showError(
        `Please switch to ${networkConfig.name} (Chain ID: ${networkConfig.chainId}) to use Betley. You're currently on Chain ID: ${chainId}`,
        'Wrong Network'
      )
      return false
    }

    return true
  }

  const isCorrectChain = isConnected ? chainId === networkConfig.chainId : true

  return {
    validateChain,
    isCorrectChain,
    currentChainId: chainId,
    requiredChainId: networkConfig.chainId,
    networkName: networkConfig.name
  }
}