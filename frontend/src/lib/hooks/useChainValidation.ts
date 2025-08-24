// frontend/lib/hooks/useChainValidation.ts
import { useAccount, useChainId } from 'wagmi'
import { useNotification } from './useNotification'
import { networkConfig } from '@/lib/config'
import { useCallback } from 'react'

/**
 * Passive chain validation hook - detects network mismatches but doesn't auto-switch
 * Only validates during actual transactions to respect user network choice
 * 
 * Usage:
 * const { validateForTransaction, isCorrectChain } = useChainValidation()
 * const canProceed = validateForTransaction() // Only call before transactions
 * if (!canProceed) return // Don't proceed with transaction
 */
export function useChainValidation() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { showError } = useNotification()

  // Passive detection - no auto-switching behavior
  const isCorrectChain = isConnected ? chainId === networkConfig.chainId : true

  // Only validate when user actually attempts a transaction
  const validateForTransaction = useCallback((): boolean => {
    // If not connected, let the wallet connection flow handle it
    if (!isConnected) {
      return true
    }

    // Check if on correct chain before transaction
    if (!isCorrectChain) {
      showError(
        `Please switch to ${networkConfig.name} to complete this transaction.`,
        'Wrong Network'
      )
      return false
    }

    return true
  }, [isConnected, isCorrectChain, showError])

  return {
    // Core validation
    validateForTransaction,
    isCorrectChain,
    
    // Network information
    currentChainId: chainId,
    requiredChainId: networkConfig.chainId,
    networkName: networkConfig.name,
    
    // Removed: validateChain, switchToCorrectChain, isSwitching, hasAttemptedAutoSwitch
  }
}