// frontend/app/setup/hooks/useBetCreation.ts - ENHANCED DEBUG VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
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
  
  // Debug: Log contract address on load
  useEffect(() => {
    console.log('🏠 Contract Address:', BETLEY_ADDRESS)
    console.log('🪙 Zero Address:', ZERO_ADDRESS)
  }, [])
  
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
    isPending: isWritePending,
    error: writeError
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    data: receipt,
    error: receiptError
  } = useWaitForTransactionReceipt({ hash: txHash })

  // Debug: Log ALL transaction states
  useEffect(() => {
    console.log('🐛 FULL Transaction Debug:', {
      // Contract info
      contractAddress: BETLEY_ADDRESS,
      userAddress: address,
      betCounter: betCounter?.toString(),
      
      // Transaction states
      txHash,
      isWritePending,
      isConfirming,
      isSuccess,
      
      // Errors
      writeError: writeError?.message,
      receiptError: receiptError?.message,
      
      // Receipt
      receipt: receipt ? 'received' : 'none',
      
      // State
      stateLoading: state.isLoading,
      stateError: state.error
    })
  }, [txHash, isWritePending, isConfirming, isSuccess, receipt, writeError, receiptError, betCounter, address, state])

  // Generate random ID for immediate redirect
  const generateRandomId = () => Math.random().toString(36).substring(2, 15)

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && receipt && betCounter !== undefined) {
      console.log('🎉 SUCCESS! Processing transaction...')
      
      const randomId = generateRandomId()
      
      // Store mapping in localStorage for the redirect
      const betMapping = {
        randomId,
        actualBetId: betCounter.toString(),
        timestamp: Date.now()
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`bet_${randomId}`, JSON.stringify(betMapping))
        console.log('💾 Stored mapping:', betMapping)
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['betCounter'] })
      queryClient.invalidateQueries({ queryKey: ['bet'] })
      
      setState(prev => ({ ...prev, isLoading: false }))
      showSuccess('Redirecting to your new bet...', `Created Bet "${lastBetName}"`)

      // Redirect to the bet page
      setTimeout(() => {
        console.log('🔄 Redirecting to:', `/bets/${randomId}`)
        router.push(`/bets/${randomId}`)
      }, 1000)
    }
  }, [isSuccess, receipt, betCounter, address, router, lastBetName, showSuccess, queryClient])

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Write Error:', writeError)
    }
    if (receiptError) {
      console.error('❌ Receipt Error:', receiptError)
    }
  }, [writeError, receiptError])

  const createBet = async (
    name: string, 
    options: string[], 
    durationInSeconds: number
  ) => {
    console.log('🚀 STARTING BET CREATION')
    console.log('📝 Input params:', { name, options, durationInSeconds })
    console.log('🏠 Using contract:', BETLEY_ADDRESS)
    console.log('👤 User address:', address)
    
    if (!address) {
      console.log('❌ No wallet connected')
      setState(prev => ({ ...prev, error: 'Please connect your wallet' }))
      return
    }

    if (durationInSeconds <= 0) {
      console.log('❌ Invalid duration')
      setState(prev => ({ ...prev, error: 'Please set a valid duration' }))
      return
    }

    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }))
      setLastBetName(name)
      
      console.log('🔄 Refreshing bet counter...')
      await refetchBetCounter()
      
      console.log('📋 Contract call parameters:')
      const contractArgs = [name, options, BigInt(durationInSeconds), ZERO_ADDRESS]
      console.log('  - name:', name)
      console.log('  - options:', options)
      console.log('  - duration:', BigInt(durationInSeconds).toString())
      console.log('  - token (native HYPE):', ZERO_ADDRESS)
      
      console.log('📞 Calling writeContract...')
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: contractArgs,
      })

      console.log('✅ writeContract called successfully, waiting for user approval...')
      
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
      
      console.error('💥 Actual error to show user:', errorMessage)
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
    betCounter,
    // Debug info
    txHash,
    writeError,
    receiptError
  }
}