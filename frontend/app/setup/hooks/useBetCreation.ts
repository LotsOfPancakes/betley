// frontend/app/setup/hooks/useBetCreation.ts - Updated with chain validation and isPublic support
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
import { useChainValidation } from '@/lib/hooks/useChainValidation'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
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
  const [lastIsPublic, setLastIsPublic] = useState<boolean>(false)  // ✅ NEW STATE
  const [betCounterWhenStarted, setBetCounterWhenStarted] = useState<number | null>(null)
  
  const router = useRouter()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const { validateChain } = useChainValidation()
  
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

  // ✅ CRITICAL: Handle successful transaction with async mapping creation
  useEffect(() => {
    if (isSuccess && receipt && betCounterWhenStarted !== null && address && lastBetName) {
      const createMappingAndRedirect = async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true }))
          
          // The bet ID is the counter value when we started
          const newBetId = betCounterWhenStarted
          
          // ✅ UPDATED: Pass isPublic to mapping creation
          const randomId = await UnifiedBetMapper.createMapping(
            newBetId,
            lastBetName,
            address,
            lastIsPublic  // ✅ NEW PARAMETER
          )
          
          // Invalidate React Query cache
          queryClient.invalidateQueries({ queryKey: ['betCounter'] })
          queryClient.invalidateQueries({ queryKey: ['bet'] })
          queryClient.invalidateQueries({ queryKey: ['bet-mapping'] })
          
          setState(prev => ({ ...prev, isLoading: false }))
          showSuccess('Bet created successfully!')

          // Now safe to redirect
          router.push(`/bets/${randomId}`)
          
        } catch (error) {
          console.error('Error creating mapping:', error)
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Failed to create bet link. Please try again.'
          }))
          showError('Failed to create bet link. Please try again.')
        }
      }
      
      createMappingAndRedirect()
    }
  }, [isSuccess, receipt, betCounterWhenStarted, address, lastBetName, lastIsPublic, queryClient, showSuccess, showError, router])

  // ✅ UPDATED: Main create bet function with isPublic parameter
  const createBet = async (
    betName: string,
    options: string[],
    durationInSeconds: number,
    tokenAddress?: string,
    isPublic: boolean = false  // ✅ NEW PARAMETER
  ) => {
    // ✅ VALIDATE CHAIN FIRST
    if (!validateChain()) return

    if (!address || !betCounter) {
      showError('Please connect your wallet first')
      return
    }

    if (!betName.trim() || options.length < 2) {
      showError('Please provide a bet name and at least 2 options')
      return
    }

    try {
      setState({ isLoading: true, error: null })
      setLastBetName(betName.trim())
      setLastIsPublic(isPublic)  // ✅ NEW: Store isPublic state
      setBetCounterWhenStarted(Number(betCounter))
      
      // ✅ NOTE: Smart contract function signature remains unchanged
      // isPublic is only stored in database, not on-chain
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [
          betName.trim(),
          options.filter(opt => opt.trim()),
          BigInt(durationInSeconds),
          tokenAddress || '0x0000000000000000000000000000000000000000'
        ],
      })
      
    } catch (error: unknown) {
      console.error('Error creating bet:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setState({ isLoading: false, error: null })
        return
      }
      
      setState({ 
        isLoading: false, 
        error: 'Failed to create bet. Please try again.'
      })
      showError('Failed to create bet. Please try again.')
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    createBet,
    clearError,
    isCreating: isWritePending,
    isConfirming,
    isSuccess,
    isLoading: state.isLoading,
    error: state.error,
  }
}