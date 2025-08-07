// frontend/app/bets/[id]/hooks/useBetActions.ts - Updated with chain validation
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { useNotification } from '@/lib/hooks/useNotification'
import { useChainValidation } from '@/lib/hooks/useChainValidation' // ✅ ADD THIS
import { BETLEY_ABI, BETLEY_ADDRESS, MOCKERC20_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'
import { isNativeETH } from '@/lib/tokenUtils'

type TransactionType = 'approve' | 'placeBet' | 'claimWinnings' | 'claimRefund' | 'resolveBet'

export function useBetActions(betId: string, tokenAddress?: string, resolved?: boolean, resolutionDeadlinePassed?: boolean) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTxType, setCurrentTxType] = useState<TransactionType | null>(null)
  const [resolutionWinningOption, setResolutionWinningOption] = useState<number | null>(null)
  
  const numericBetId = parseInt(betId)
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const { validateChain } = useChainValidation() // ✅ ADD THIS
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
    
    // ✅ VALIDATE CHAIN FIRST
    if (!validateChain()) return
    
    try {
      setIsSubmitting(true)
      setCurrentTxType('approve')
      
      const decimals = 18
      const amountWei = parseUnits(betAmount, decimals)
      
      writeContract({
        address: MOCKERC20_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS, amountWei],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      showError(
        'Please check your wallet and try again. Make sure you have sufficient funds for gas fees.'
      )
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null || isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST
    if (!validateChain()) return
    
    try {
      setIsSubmitting(true)
      setCurrentTxType('placeBet')
      
      const decimals = 18
      const amountWei = parseUnits(betAmount, decimals)
      
      const txArgs = {
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'placeBet' as const,
        args: [BigInt(numericBetId), selectedOption, amountWei] as const,
        ...(isNativeBet && { value: amountWei })
      }
      
      writeContract(txArgs)
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      if (errorMessage.toLowerCase().includes('already placed bet on different option')) {
        showError('You can only bet on one option per bet. To add more funds, select the same option you previously chose.')
      } else {
        showError(
          isNativeBet 
            ? 'Failed to place bet. Please check your ETH balance and try again.'
            : 'Failed to place bet. Please make sure you have approved the token transfer.'
        )
      }
      
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handleClaimWinnings = async () => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST
    if (!validateChain()) return
    
    try {
      setIsSubmitting(true)
      
      // Determine if this is a refund claim or winnings claim
      const isRefundClaim = !resolved && resolutionDeadlinePassed
      const functionName = isRefundClaim ? 'claimRefund' : 'claimWinnings'
      const txType = isRefundClaim ? 'claimRefund' : 'claimWinnings'
      
      setCurrentTxType(txType)
      
      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName,
        args: [BigInt(numericBetId)],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      const actionType = (!resolved && resolutionDeadlinePassed) ? 'refund' : 'winnings'
      showError(`Failed to claim ${actionType}. Please try again.`)
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handleResolveBet = async (winningOption: number) => {
    if (isWritePending) return
    
    // ✅ VALIDATE CHAIN FIRST
    if (!validateChain()) return
    
    try {
      setIsSubmitting(true)
      setCurrentTxType('resolveBet')
      setResolutionWinningOption(winningOption) // Store winning option for tracking
      
      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'resolveBet',
        args: [BigInt(numericBetId), winningOption],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      showError('Failed to resolve bet. Please try again.')
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  // === EFFECTS ===
  // Reset submission state when transaction is sent
  useEffect(() => {
    if (txHash) {
      setIsSubmitting(false)
    }
  }, [txHash])

  // Handle transaction confirmations
  useEffect(() => {
    if (isConfirmed && receipt && currentTxType) {
      queryClient.invalidateQueries({ queryKey: ['bet', numericBetId] })
      queryClient.invalidateQueries({ queryKey: ['userBets', numericBetId] })
      queryClient.invalidateQueries({ queryKey: ['user-bets-v2'] }) // ✅ Invalidate bet list cache
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['allowance'] })
      queryClient.invalidateQueries({ queryKey: ['userClaimed'] })
      
      switch (currentTxType) {
        case 'approve':
          showSuccess('Token approval successful! You can now place your bet.')
          break
        case 'placeBet':
          showSuccess('Bet placed successfully!')
          
          // ✅ REAL-TIME ANALYTICS: Track bet placement
          if (userAddress && receipt?.transactionHash) {
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
                    txHash: receipt.transactionHash
                  })
                })
                console.log('Bet placement analytics tracked successfully')
              } catch (error) {
                console.error('Failed to track bet placement analytics:', error)
                // Don't show error to user - analytics failure shouldn't affect UX
              }
            })()
          }
          
          setBetAmount('')
          setJustPlacedBet(true)
          setTimeout(() => setJustPlacedBet(false), 5000)
          break
        case 'claimWinnings':
          showSuccess('Winnings claimed successfully!')
          break
        case 'resolveBet':
          showSuccess('Bet resolved successfully!')
          
          // ✅ REAL-TIME ANALYTICS: Track bet resolution
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
                console.log('Bet resolution analytics tracked successfully')
                
                // ✅ Force refresh bet list after database update
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['user-bets-v2'] })
                }, 1000) // 1 second delay to ensure database update is complete
                
              } catch (error) {
                console.error('Failed to track bet resolution analytics:', error)
                // Don't show error to user - analytics failure shouldn't affect UX
              }
            })()
          }
          
          // Reset resolution state
          setResolutionWinningOption(null)
          break
      }
      
      setCurrentTxType(null)
    }
  }, [isConfirmed, receipt, currentTxType, queryClient, numericBetId, showSuccess, betAmount, userAddress, resolutionWinningOption])

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setIsSubmitting(false)
    }
  }, [writeError])

  return {
    // State
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    justPlacedBet,
    isNativeBet,
    
    // Actions
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    
    // Loading states
    isPending: isWritePending || isConfirming || isSubmitting,
    isApproving: currentTxType === 'approve' && (isWritePending || isConfirming),
  }
}