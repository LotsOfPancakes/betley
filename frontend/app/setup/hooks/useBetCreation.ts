// frontend/app/setup/hooks/useBetCreation.ts - PROPERLY FIXED: Wait for transaction receipt
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

  // 🔧 FIXED: Handle successful transaction ONLY after receipt is confirmed
  useEffect(() => {
  if (isSuccess && receipt && betCounter !== undefined && address) {
    console.log('🎉 Transaction successful! Creating unified mapping...')
    
    // 🔍 STEP 1: Log initial state
    console.log('🔍 STEP 1 - Initial State:', {
      betCounter: betCounter?.toString(),
      betCounterType: typeof betCounter,
      lastBetName,
      address,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber?.toString()
    })
    
    // 🔍 STEP 2: Check existing mappings
    const existingMappings = UnifiedBetMapper.getAllMappings()
    console.log('🔍 STEP 2 - Existing mappings before creation:', existingMappings)
    
    // 🔍 STEP 3: Calculate the bet ID
    const numericBetId = Number(betCounter)
    console.log('🔍 STEP 3 - Bet ID calculation:', {
      rawBetCounter: betCounter,
      numericBetId,
      calculationCorrect: numericBetId >= 0
    })
    
    // 🔍 STEP 4: Create mapping with detailed logging
    console.log('🔍 STEP 4 - About to create mapping with:', {
      numericBetId,
      lastBetName,
      address
    })
    
    const randomId = UnifiedBetMapper.createMapping(
      numericBetId,
      lastBetName,
      address
    )
    
    console.log('🔍 STEP 4 - Mapping creation result:', randomId)
    
    // 🔍 STEP 5: Verify mapping was created
    const newMappings = UnifiedBetMapper.getAllMappings()
    console.log('🔍 STEP 5 - All mappings after creation:', newMappings)
    
    // 🔍 STEP 6: Test the specific mapping
    const specificMapping = UnifiedBetMapper.getMapping(randomId)
    console.log('🔍 STEP 6 - Specific mapping test:', {
      randomId,
      foundMapping: specificMapping,
      canReverseLookup: UnifiedBetMapper.getNumericId(randomId)
    })
    
    // 🔍 STEP 7: Log localStorage directly
    const rawStorage = localStorage.getItem('betley_unified_mappings')
    console.log('🔍 STEP 7 - Raw localStorage content:', rawStorage)
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['betCounter'] })
    queryClient.invalidateQueries({ queryKey: ['bet'] })
    
    setState(prev => ({ ...prev, isLoading: false }))
    showSuccess('Redirecting to your new bet...', `Created Bet "${lastBetName}"`)

    // 🔍 STEP 8: Pre-redirect final check
    setTimeout(() => {
      console.log('🔍 STEP 8 - Pre-redirect final check:', {
        randomId,
        willRedirectTo: `/bets/${randomId}`,
        mappingStillExists: !!UnifiedBetMapper.getMapping(randomId),
        allCurrentMappings: UnifiedBetMapper.getAllMappings()
      })
      
      router.push(`/bets/${randomId}`)
    }, 3000)
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
      
      // Store the current bet counter - this will be our bet's ID
      if (betCounter !== undefined) {
        setBetCounterWhenStarted(Number(betCounter))
        console.log('📊 Starting bet creation - expected bet ID:', Number(betCounter))
      } else {
        throw new Error('Could not determine bet counter')
      }
      
      const contractArgs: readonly [string, readonly string[], bigint, `0x${string}`] = [
        name,
        options as readonly string[],
        BigInt(durationInSeconds),
        ZERO_ADDRESS as `0x${string}` // Native HYPE token
      ]
      
      console.log('📝 Submitting bet creation transaction:', {
        name,
        options,
        duration: durationInSeconds,
        token: 'Native HYPE',
        expectedBetId: Number(betCounter)
      })
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: contractArgs,
      })

      console.log('✅ Transaction submitted, waiting for confirmation...')
      
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
    isCreating: isWritePending,
    isConfirming: isConfirming, // 🔧 NEW: Expose confirming state
    isSuccess: isSuccess,
    isLoading: state.isLoading || isWritePending || isConfirming, // Include confirming in loading
    error: state.error,
    createBet,
    clearError,
    betCounter,
    // 🔧 NEW: Expose transaction states for better UX
    txHash,
    isWaitingForConfirmation: isWritePending === false && isConfirming === true
  }
}