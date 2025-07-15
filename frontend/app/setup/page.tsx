// frontend/app/setup/hooks/useBetCreation.ts - CLEANED AND FULLY FIXED VERSION
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
  const { data: betCounter } = useReadContract({
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
      showSuccess('Bet created successfully!')
      
      // Navigate to the new bet
      router.push(`/bets/${randomId}`)
      
      // Reset state
      setLastBetName('')
      setBetCounterWhenStarted(null)
    }
  }, [isSuccess, receipt, betCounterWhenStarted, address, lastBetName, router, queryClient, showSuccess])

  // Handle errors
  useEffect(() => {
    if (!isWritePending && !isConfirming && state.isLoading && !txHash) {
      // Transaction was rejected or failed
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [isWritePending, isConfirming, state.isLoading, txHash])

  const createBet = async (
    name: string,
    options: string[],
    startTime: Date,
    endTime: Date,
    tokenAddress: string = ZERO_ADDRESS
  ) => {
    if (!address) {
      showError('Please connect your wallet first')
      return
    }

    if (betCounter === undefined || betCounter === null) {
      showError('Unable to fetch bet counter')
      return
    }

    try {
      setState({ isLoading: true, error: null })
      
      // Store bet info and counter BEFORE transaction
      setLastBetName(name)
      setBetCounterWhenStarted(Number(betCounter))

      const startTimeUnix = Math.floor(startTime.getTime() / 1000)
      const endTimeUnix = Math.floor(endTime.getTime() / 1000)

      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [
          name,
          tokenAddress as `0x${string}`,
          options,
          BigInt(startTimeUnix),
          BigInt(endTimeUnix)
        ] as const,
      })

    } catch (error) {
      setState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to create bet' 
      })
      setLastBetName('')
      setBetCounterWhenStarted(null)
      
      // Show user-friendly error
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || 
            error.message.includes('User denied') ||
            error.message.includes('rejected the request')) {
          showError('Transaction cancelled')
        } else {
          showError('Failed to create bet. Please try again.')
        }
      }
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    createBet,
    isLoading: state.isLoading || isWritePending || isConfirming,
    isCreating: isWritePending,
    isConfirming,
    isSuccess,
    error: state.error,
    txHash,
    isConfirmed: isSuccess,
    clearError
  }
}