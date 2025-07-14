// frontend/app/setup/hooks/useBetCreation.ts - Fixed TypeScript types
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

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && receipt && betCounter !== undefined && address) {
      console.log('🎉 Transaction successful! Creating unified mapping...')
      
      // Use the unified mapping system
      const numericBetId = Number(betCounter)
      const randomId = UnifiedBetMapper.createMapping(
        numericBetId,
        lastBetName,
        address
      )
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['betCounter'] })
      queryClient.invalidateQueries({ queryKey: ['bet'] })
      
      setState(prev => ({ ...prev, isLoading: false }))
      showSuccess('Redirecting to your new bet...', `Created Bet "${lastBetName}"`)

      // Redirect to the bet page with unified random ID
      setTimeout(() => {
        console.log('🔄 Redirecting to:', `/bets/${randomId}`)
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
      
      // 🔧 FIXED: Properly typed contract arguments
      const contractArgs: readonly [string, readonly string[], bigint, `0x${string}`] = [
        name,
        options as readonly string[], // Ensure readonly type
        BigInt(durationInSeconds),
        ZERO_ADDRESS as `0x${string}` // Native HYPE token
      ]
      
      console.log('📝 Contract call with unified mapping system:', {
        name,
        options,
        duration: durationInSeconds,
        token: 'Native HYPE'
      })
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: contractArgs,
      })

      console.log('✅ writeContract called successfully')
      
    } catch (err) {
      console.error('❌ createBet error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bet'
      
      // Check for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        console.log('🚫 User cancelled transaction')
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
    isCreating: isWritePending,           // ✅ Map to expected property names
    isConfirming: isConfirming,           // ✅ Direct mapping
    isSuccess: isSuccess,                 // ✅ Direct mapping  
    isLoading: state.isLoading || isWritePending || isConfirming,  // Keep for backward compatibility
    error: state.error,                   // ✅ Direct mapping
    createBet,
    clearError,
    betCounter
  }
}