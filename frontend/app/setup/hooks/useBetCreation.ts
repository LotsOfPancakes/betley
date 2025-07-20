// frontend/app/setup/hooks/useBetCreation.ts - Updated for async mapping creation
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
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

  // ✅ CRITICAL: Handle successful transaction with async mapping creation
  useEffect(() => {
    if (isSuccess && receipt && betCounterWhenStarted !== null && address && lastBetName) {
      const createMappingAndRedirect = async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true }))
          
          // The bet ID is the counter value when we started
          const newBetId = betCounterWhenStarted
          
          // ✅ AWAIT the mapping creation before redirect
          const randomId = await UnifiedBetMapper.createMapping(
            newBetId,
            lastBetName,
            address
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
          showError('Failed to create bet link')
        }
      }
      
      createMappingAndRedirect()
    }
  }, [isSuccess, receipt, betCounterWhenStarted, address, lastBetName, queryClient, showSuccess, showError, router])

  const createBet = async (name: string, options: string[], durationInSeconds: number) => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Please connect your wallet' }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Store bet details for mapping creation
      setLastBetName(name)
      setBetCounterWhenStarted(Number(betCounter || 0))
      
      // Create the bet
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [name, options, BigInt(durationInSeconds), '0x0000000000000000000000000000000000000000'],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied')) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to create bet. Please try again.' 
      }))
      showError('Failed to create bet')
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    isCreating: isWritePending,
    isConfirming,
    isSuccess,
    error: state.error,
    createBet,
    clearError,
  }
}