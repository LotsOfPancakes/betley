// frontend/app/setup/hooks/useBetCreation.ts
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { BetIdMapper } from '@/lib/betIdMapping'
import { BetCreationState } from '../types/setup.types'

export function useBetCreation() {
  const router = useRouter()
  const { address } = useAccount()
  const [lastBetName, setLastBetName] = useState<string | null>(null)
  const [state, setState] = useState<BetCreationState>({
    isCreating: false,
    isConfirming: false,
    isSuccess: false,
    error: null
  })

  // Contract hooks
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  // Get current bet counter for ID mapping
  const { data: betCounter, refetch: refetchBetCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  // Update state based on transaction status
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isCreating: isPending,
      isConfirming,
      isSuccess,
      error: writeError?.message || null
    }))
  }, [isPending, isConfirming, isSuccess, writeError])

  // Handle successful bet creation - WAIT for transaction receipt
  useEffect(() => {
    if (isSuccess && receipt && betCounter !== undefined && address) {
      // Transaction is now ACTUALLY mined
      const newNumericBetId = Number(betCounter)
      
      console.log(`Bet created and mined! Numeric ID: ${newNumericBetId}`)
      
      // Create random ID mapping
      const randomId = BetIdMapper.addMapping(newNumericBetId, lastBetName || 'Untitled Bet', address)
      
      console.log(`Random ID generated: ${randomId}`)
      console.log(`Mapping saved: ${randomId} -> ${newNumericBetId}`)
      
      // Now it's safe to redirect
      setTimeout(() => {
        router.push(`/bets/${randomId}`)
      }, 1000) // Small delay to ensure everything is processed
    }
  }, [isSuccess, receipt, betCounter, address, router, lastBetName])

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
      // Clear any previous errors and store bet name
      setState(prev => ({ ...prev, error: null }))
      setLastBetName(name)
      
      // Refresh bet counter to get accurate next ID
      await refetchBetCounter()
      
      console.log(`Creating bet: "${name}" with duration: ${durationInSeconds} seconds`)
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [name, options, BigInt(durationInSeconds)],
      })

      // NOTE: Redirect now happens in useEffect when transaction is actually mined
    } catch (err) {
      console.error('Error creating bet:', err)
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to create bet' 
      }))
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    ...state,
    createBet,
    clearError,
    betCounter
  }
}