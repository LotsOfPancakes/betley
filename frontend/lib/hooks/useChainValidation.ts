// frontend/lib/hooks/useChainValidation.ts
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useNotification } from './useNotification'
import { networkConfig } from '@/lib/config'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook for validating that the user is on the correct chain before transactions
 * Now includes auto-switching functionality for seamless UX
 * 
 * Usage:
 * const { validateChain, isCorrectChain, switchToCorrectChain } = useChainValidation()
 * if (!validateChain()) return // Don't proceed with transaction
 */
export function useChainValidation() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { showError, showSuccess } = useNotification()
  const [hasAttemptedAutoSwitch, setHasAttemptedAutoSwitch] = useState(false)

  const isCorrectChain = isConnected ? chainId === networkConfig.chainId : true

  // Auto-switch on wallet connection if on wrong chain
  useEffect(() => {
    if (isConnected && !isCorrectChain && !hasAttemptedAutoSwitch && !isSwitching) {
      setHasAttemptedAutoSwitch(true)
      switchToCorrectChain()
    }
  }, [isConnected, isCorrectChain, hasAttemptedAutoSwitch, isSwitching, switchToCorrectChain])

  // Reset auto-switch flag when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedAutoSwitch(false)
    }
  }, [isConnected])

  const switchToCorrectChain = useCallback(async () => {
    if (!switchChain) {
      showError('Chain switching not supported by your wallet', 'Switch Network')
      return false
    }

    try {
      await switchChain({ chainId: networkConfig.chainId })
      showSuccess(`Switched to ${networkConfig.name}`, 'Network Updated')
      return true
    } catch (error) {
      console.error('Failed to switch chain:', error)
      showError(
        `Failed to switch to ${networkConfig.name}. Please switch manually in your wallet.`,
        'Switch Network Failed'
      )
      return false
    }
  }, [switchChain, showError, showSuccess])

  const validateChain = (): boolean => {
    // If not connected, let the wallet connection flow handle it
    if (!isConnected) {
      return true
    }

    // Check if on correct chain
    if (!isCorrectChain) {
      showError(
        `Please switch to ${networkConfig.name} to use Betley. Click the network indicator to switch automatically.`,
        'Wrong Network'
      )
      return false
    }

    return true
  }

  return {
    validateChain,
    isCorrectChain,
    currentChainId: chainId,
    requiredChainId: networkConfig.chainId,
    networkName: networkConfig.name,
    switchToCorrectChain,
    isSwitching,
    hasAttemptedAutoSwitch
  }
}