// frontend/app/bets/[id]/hooks/useBetActionsNew.ts - New Privacy-Focused Actions
import { useState, useEffect, useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { useNotification } from '@/lib/hooks/useNotification'
import { useChainValidation } from '@/lib/hooks/useChainValidation'
import { BETLEY_NEW_ABI, BETLEY_NEW_ADDRESS } from '@/lib/contractABI-new'
import { ERC20_ABI } from '@/lib/erc20ABI'
import { isNativeETH } from '@/lib/tokenUtils'

type TransactionType = 'approve' | 'placeBet' | 'claimWinnings' | 'claimRefund' | 'claimCreatorFees' | 'resolveBet'

export function useBetActionsNew(betId: string, tokenAddress?: string) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTxType, setCurrentTxType] = useState<TransactionType | null>(null)
  const [resolutionWinningOption, setResolutionWinningOption] = useState<number | null>(null)
  
  const numericBetId = parseInt(betId)
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const { validateChain } = useChainValidation()
  const { address: userAddress } = useAccount()

  // Determine if this bet uses native ETH
  const isNativeBet = tokenAddress ? isNativeETH(tokenAddress) : true

  // Contract interactions
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    data: receipt 
  } = useWaitForTransactionReceipt({ hash: txHash })

  // === ACTION HANDLERS WITH CHAIN VALIDATION ===
  const handleApprove = async () => {
    if (!betAmount || isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('approve')
      setIsSubmitting(true)
      
      const amount = parseUnits(betAmount, 18)
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_NEW_ADDRESS, amount],
      })
    } catch {
      showError('Failed to approve tokens')
      cleanupTransactionState()
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null || isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('placeBet')
      setIsSubmitting(true)
      
      const amount = parseUnits(betAmount, 18)
      
      // The new contract always expects 3 parameters: betId, option, amount
      // For native ETH, amount is also passed as a parameter AND as value
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'placeBet',
        args: [BigInt(numericBetId), selectedOption, amount],
        value: isNativeBet ? amount : undefined,
      })
    } catch {
      showError('Failed to place bet')
      cleanupTransactionState()
    }
  }

  const handleClaimWinnings = async () => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('claimWinnings')
      setIsSubmitting(true)
      
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(numericBetId)],
      })
    } catch {
      showError('Failed to claim winnings')
      cleanupTransactionState()
    }
  }

  const handleClaimRefund = async () => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('claimRefund')
      setIsSubmitting(true)
      
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'claimRefund',
        args: [BigInt(numericBetId)],
      })
    } catch {
      showError('Failed to claim refund')
      cleanupTransactionState()
    }
  }

  const handleClaimCreatorFees = async () => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('claimCreatorFees')
      setIsSubmitting(true)
      
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'claimCreatorFees',
        args: [BigInt(numericBetId)],
      })
    } catch {
      showError('Failed to claim creator fees')
      cleanupTransactionState()
    }
  }

  const handleResolveBet = async (winningOption: number) => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST - properly await the async validation
    const isValidChain = await validateChain(true)
    if (!isValidChain) return
    
    try {
      setCurrentTxType('resolveBet')
      setIsSubmitting(true)
      setResolutionWinningOption(winningOption)
      
      writeContract({
        address: BETLEY_NEW_ADDRESS,
        abi: BETLEY_NEW_ABI,
        functionName: 'resolveBet',
        args: [BigInt(numericBetId), winningOption],
      })
    } catch {
      showError('Failed to resolve bet')
      cleanupTransactionState()
    }
  }

  // === TRANSACTION SUCCESS HANDLING ===
  useEffect(() => {
    if (isConfirmed && receipt && currentTxType) {
      const txType = currentTxType
      
      // Clear transaction state
      setIsSubmitting(false)
      setCurrentTxType(null)
      
      // Show success message and handle post-transaction logic
      switch (txType) {
        case 'approve':
          showSuccess('Token approval successful!')
          // Invalidate allowance queries
          queryClient.invalidateQueries({ queryKey: ['allowance'] })
          break
          
        case 'placeBet':
          showSuccess('Bet placed successfully!')
          setJustPlacedBet(true)
          
          // ✅ ANALYTICS: Track bet placement
          if (userAddress && receipt?.transactionHash && betAmount && selectedOption !== null) {
            // Use async IIFE to handle the API call
            (async () => {
              try {
                 await fetch('/api/bets/place', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    betId: numericBetId,
                    userAddress: userAddress,
                    amount: parseUnits(betAmount, 18).toString(),
                    txHash: receipt.transactionHash,
                    optionIndex: selectedOption  // NEW: Pass the selected option for real-time totals
                  })
                })

              } catch (error) {
                console.error('Failed to track bet placement analytics:', error)
                // Don't show error to user - analytics failure shouldn't affect UX
              }
            })()
          }
          
          setBetAmount('')
          setSelectedOption(null)
          
          // Auto-hide the success state after 3 seconds
          setTimeout(() => setJustPlacedBet(false), 3000)
          
          // Invalidate all bet-related queries
          queryClient.invalidateQueries({ queryKey: ['bet'] })
          queryClient.invalidateQueries({ queryKey: ['userBets'] })
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          break
          
        case 'claimWinnings':
          showSuccess('Winnings claimed successfully!')
          // Invalidate claim status and balance queries
          queryClient.invalidateQueries({ queryKey: ['hasClaimed'] })
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          break
          
        case 'claimRefund':
          showSuccess('Refund claimed successfully!')
          // Invalidate claim status and balance queries
          queryClient.invalidateQueries({ queryKey: ['hasClaimed'] })
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          break
          
        case 'claimCreatorFees':
          showSuccess('Creator fees claimed successfully!')
          // Invalidate creator fee claim status and balance queries
          queryClient.invalidateQueries({ queryKey: ['hasClaimedCreatorFees'] })
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          break
          
        case 'resolveBet':
          showSuccess(`Bet resolved! Winning option: ${resolutionWinningOption}`)
          
          // ✅ ANALYTICS: Track bet resolution
          if (userAddress && receipt?.transactionHash && resolutionWinningOption !== null) {
            // Use async IIFE to handle the API call
            (async () => {
              try {
                await fetch('/api/bets/resolve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    betId: numericBetId,
                    resolverAddress: userAddress,
                    winningOption: resolutionWinningOption,
                    txHash: receipt.transactionHash
                  })
                })

              } catch (error) {
                console.error('Failed to track bet resolution analytics:', error)
                // Don't show error to user - analytics failure shouldn't affect UX
              }
            })()
          }
          
          // Sync resolution to database
          if (resolutionWinningOption !== null) {
            syncResolutionToDatabase(numericBetId, resolutionWinningOption)
          }
          
          setResolutionWinningOption(null)
          // Invalidate bet details to show resolved state
          queryClient.invalidateQueries({ queryKey: ['bet'] })
          queryClient.invalidateQueries({ queryKey: ['bet-details-new'] })
          break
      }
    }
  }, [isConfirmed, receipt, currentTxType, resolutionWinningOption, showSuccess, queryClient, numericBetId, userAddress, betAmount, selectedOption, syncResolutionToDatabase])

  // === ERROR HANDLING ===
  useEffect(() => {
    if (writeError) {
      console.error('Transaction error:', writeError)
      
      // Handle user rejection gracefully
      const errorMessage = writeError.message.toLowerCase()
      if (errorMessage.includes('user rejected') || 
          errorMessage.includes('cancelled') ||
          errorMessage.includes('denied')) {
        // Don't show error for user cancellation
      } else if (errorMessage.includes('cannot resolve to option with no bets')) {
        showError('Cannot resolve to an option with no bets. Please select an option that has received bets.')
      } else {
        showError(`Transaction failed: ${writeError.message}`)
      }
      
      // Reset state using cleanup function
      cleanupTransactionState()
    }
  }, [writeError, showError, cleanupTransactionState])

  // === HELPER FUNCTIONS ===
  const cleanupTransactionState = useCallback(() => {
    setIsSubmitting(false)
    setCurrentTxType(null)
    setResolutionWinningOption(null)
  }, [])

  const syncResolutionToDatabase = useCallback(async (betId: number, winningOption: number) => {
    try {
      await fetch('/api/bets/sync-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numericId: betId,
          resolved: true,
          winningOption,
          totalAmounts: [] // Will be updated by blockchain sync later
        })
      })
    } catch {
      showError('Failed to claim winnings')
      cleanupTransactionState()
    }
  }, [showError, cleanupTransactionState])

  // === COMPUTED STATE ===
  const isPending = isWritePending || isConfirming || isSubmitting
  const isApproving = currentTxType === 'approve' && isPending

  return {
    // Form state
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    
    // Transaction state
    isPending,
    isApproving,
    justPlacedBet,
    
    // Action handlers
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleClaimRefund,
    handleClaimCreatorFees,
    handleResolveBet,
    
    // Debug info
    currentTxType,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
  }
}