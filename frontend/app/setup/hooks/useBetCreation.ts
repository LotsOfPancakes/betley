// frontend/app/setup/hooks/useBetCreation.ts - CLEANED VERSION: Debug logs removed
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { ZERO_ADDRESS } from '@/lib/tokenUtils'
import { UnifiedBetMapper } from '@/lib/betIdMapping'

interface BetCreationState {
  isLoading: boolean
  error: string | null
}

export function useBetCreation() {
  const [state, setState] = useState<BetCreationState>({
    isLoading: false,
    error: null
  })
  const [lastBetName, setLastBetName] = useState<string>('')
  const [betCounterWhenStarted, setBetCounterWhenStarted] = useState<number | null>(null)
  
  const router = useRouter()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  
  // Get current bet counter for ID prediction
  const { data: betCounter, refetch: refetchBetCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
    query: {
      staleTime: 5000,
    }
  })

  // Contract interaction
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    data: receipt 
  } = useWaitForTransactionReceipt({ hash: txHash })

  // Handle successful transaction ONLY after receipt is confirmed
  useEffect(() => {
    if (isSuccess && receipt && betCounterWhenStarted !== null && address && lastBetName) {
      // The bet ID is the counter value when we started
      const newBetId = betCounterWhenStarted
      
      // Create the mapping AFTER transaction is confirmed
      const randomId = UnifiedBetMapper.createMapping(
        newBetId,
        lastBetName,
        address
      )
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['betCounter'] })
      queryClient.invalidateQueries({ queryKey: ['bet'] })
      
      setState(prev => ({ ...prev, isLoading: false }))
      showSuccess('Bet created successfully! Redirecting...', `Created Bet "${lastBetName}"`)

      // Reset state
      setBetCounterWhenStarted(null)
      setLastBetName('')

      // Redirect to the confirmed bet
      setTimeout(() => {
        router.push(`/bets/${randomId}`)
      }, 3000)
    }
  }, [isSuccess, receipt, betCounterWhenStarted, address, router, lastBetName, showSuccess, queryClient])

  const createBet = async (
    name: string, 
    options: string[], 
    durationInSeconds: number
  ) => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Please connect your wallet' }))
      return
    }

    if (durationInSeconds <= 0) {
      setState(prev => ({ ...prev, error: 'Please set a valid duration' }))
      return
    }

    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }))
      setLastBetName(name)
      
      // Refresh bet counter to get accurate next ID
      await refetchBetCounter()
      
      // Store the current bet counter - this will be our bet's ID
      if (betCounter !== undefined) {
        setBetCounterWhenStarted(Number(betCounter))
      } else {
        throw new Error('Could not determine bet counter')
      }
      
      const contractArgs: readonly [string, readonly string[], bigint, `0x${string}`] = [
        name,
        options as readonly string[],
        BigInt(durationInSeconds),
        ZERO_ADDRESS as `0x${string}` // Native HYPE token
      ]
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: contractArgs,
      })
      
    } catch (err) {
      console.error('❌ createBet error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bet'
      
      // Reset state on error
      setBetCounterWhenStarted(null)
      setLastBetName('')
      
      // Check for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setState(prev => ({ ...prev, isLoading: false, error: null }))
        return
      }
      
      showError(
        'Please check your wallet connection and try again. Make sure you have sufficient funds for gas fees.',
        'Failed to Create Bet'
      )
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage
      }))
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    isCreating: isWritePending,
    isConfirming: isConfirming,
    isSuccess: isSuccess,
    isLoading: state.isLoading || isWritePending || isConfirming,
    error: state.error,
    createBet,
    clearError,
    betCounter,
    txHash,
    isWaitingForConfirmation: isWritePending === false && isConfirming === true
  }
}