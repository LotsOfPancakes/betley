// frontend/app/setup/hooks/useBetCreation.ts - Updated for Native HYPE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { useReadContract } from 'wagmi'
import { ZERO_ADDRESS } from '@/lib/tokenUtils'

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

  // Generate random ID for immediate redirect
  const generateRandomId = () => Math.random().toString(36).substring(2, 15)

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && receipt && betCounter !== undefined) {
      const randomId = generateRandomId()
      
      // Store mapping in localStorage for the redirect
      const betMapping = {
        randomId,
        actualBetId: betCounter.toString(),
        timestamp: Date.now()
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`bet_${randomId}`, JSON.stringify(betMapping))
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['betCounter'] })
      queryClient.invalidateQueries({ queryKey: ['bet'] })
      
      setState(prev => ({ ...prev, isLoading: false }))
      showSuccess('Redirecting to your new bet...', `Created Bet "${lastBetName}"`)

      // Redirect to the bet page
      setTimeout(() => {
        router.push(`/bets/${randomId}`)
      }, 1000)
    }
  }, [isSuccess, receipt, betCounter, address, router, lastBetName, showSuccess, queryClient])

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
      
      // Create bet with Native HYPE (ZERO_ADDRESS)
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [
          name, 
          options, 
          BigInt(durationInSeconds),
          ZERO_ADDRESS  // 🔥 THIS IS THE KEY CHANGE - Use native HYPE
        ],
      })

      // Success handling happens in useEffect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bet'
      
      // Check for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        // User cancelled - silently return
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
    ...state,
    isLoading: state.isLoading || isWritePending || isConfirming,
    createBet,
    clearError,
    betCounter
  }
}