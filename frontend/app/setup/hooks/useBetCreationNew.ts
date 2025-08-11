// frontend/app/setup/hooks/useBetCreationNew.ts
// New Privacy-Focused Bet Creation Hook
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/lib/hooks/useNotification'
import { useChainValidation } from '@/lib/hooks/useChainValidation'
import { BETLEY_NEW_ABI, BETLEY_NEW_ADDRESS } from '@/lib/contractABI-new'

interface BetCreationState {
  isLoading: boolean
  error: string | null
}

export function useBetCreationNew() {
  const [state, setState] = useState<BetCreationState>({
    isLoading: false,
    error: null
  })
  
  // Store bet details for database storage after contract creation
  const [pendingBetDetails, setPendingBetDetails] = useState<{
    name: string
    options: string[]
    duration: number
    tokenAddress: string
    creatorAddress: string
  } | null>(null)
  
  const [betCounterWhenStarted, setBetCounterWhenStarted] = useState<number | null>(null)
  
  const router = useRouter()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const { validateChain } = useChainValidation()
  
  // Get current bet counter for ID prediction
  const { data: betCounter } = useReadContract({
    address: BETLEY_NEW_ADDRESS,
    abi: BETLEY_NEW_ABI,
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

  // Handle successful transaction - create database mapping
  useEffect(() => {
    if (isSuccess && receipt && betCounterWhenStarted !== null && pendingBetDetails) {
      const createDatabaseMapping = async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true }))
          
          // The bet ID is the counter value when we started
          const newBetId = betCounterWhenStarted
          
          // Call our new API to store sensitive data in database
          const response = await fetch('/api/bets/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              numericId: newBetId,
              creatorAddress: pendingBetDetails.creatorAddress,
              betName: pendingBetDetails.name,
              betOptions: pendingBetDetails.options,
              tokenAddress: pendingBetDetails.tokenAddress,
              durationInSeconds: pendingBetDetails.duration,
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create bet mapping')
          }
          
          const { randomId } = await response.json()
          
          // Invalidate React Query cache
          queryClient.invalidateQueries({ queryKey: ['betCounter'] })
          queryClient.invalidateQueries({ queryKey: ['bet'] })
          
          setState(prev => ({ ...prev, isLoading: false }))
          showSuccess('Bet created successfully!')

          // Clear pending details
          setPendingBetDetails(null)
          setBetCounterWhenStarted(null)

          // Redirect to the new bet page
          router.push(`/bets/${randomId}`)
          
        } catch (error) {
          console.error('Error creating database mapping:', error)
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Failed to create bet link. Please try again.'
          }))
          showError('Failed to create bet link. Please try again.')
        }
      }
      
      createDatabaseMapping()
    }
  }, [isSuccess, receipt, betCounterWhenStarted, pendingBetDetails, queryClient, showSuccess, showError, router])

  // Main create bet function - NEW ARCHITECTURE
  const createBet = async (
    betName: string,
    options: string[],
    durationInSeconds: number,
    tokenAddress: string = '0x0000000000000000000000000000000000000000'
  ) => {
    // Validate chain first
    if (!validateChain()) return

    if (!address || betCounter == null) {
      showError('Please connect your wallet first')
      return
    }

    if (!betName.trim() || options.length < 2 || options.length > 4) {
      showError('Please provide a bet name and 2-4 options')
      return
    }

    // Validate all options are non-empty
    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length !== options.length) {
      showError('All bet options must be non-empty')
      return
    }

    try {
      setState({ isLoading: true, error: null })
      
      // Store bet details for database creation after contract success
      setPendingBetDetails({
        name: betName.trim(),
        options: validOptions,
        duration: durationInSeconds,
        tokenAddress: tokenAddress,
        creatorAddress: address
      })
      
      setBetCounterWhenStarted(Number(betCounter))
      
      // ✅ NEW CONTRACT CALL: Only operational data, no sensitive info
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'createBet',
        args: [
          validOptions.length,  // optionCount (uint8)
          BigInt(durationInSeconds),  // duration (uint256)
          tokenAddress as `0x${string}`  // token (address)
        ],
      })
      
    } catch (error: unknown) {
      console.error('Error creating bet:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Handle user rejection gracefully
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setState({ isLoading: false, error: null })
        setPendingBetDetails(null)
        return
      }
      
      setState({ 
        isLoading: false, 
        error: 'Failed to create bet. Please try again.'
      })
      showError('Failed to create bet. Please try again.')
      setPendingBetDetails(null)
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