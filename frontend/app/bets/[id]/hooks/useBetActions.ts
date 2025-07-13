// frontend/app/bets/[id]/hooks/useBetActions.ts - UNIFIED PATTERN WITH DESCRIPTIVE TOASTS
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { useNotification } from '@/lib/hooks/useNotification'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'

type TransactionType = 'approve' | 'placeBet' | 'claimWinnings' | 'resolveBet'

export function useBetActions(betId: string) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTxType, setCurrentTxType] = useState<TransactionType | null>(null)
  
  const numericBetId = parseInt(betId)
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()

  // === DIRECT CONTRACT INTERACTIONS (like useBetCreation) ===
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

  // === ACTION HANDLERS ===
  const handleApprove = async () => {
    if (!betAmount || isWritePending) return
    
    try {
      setIsSubmitting(true)
      setCurrentTxType('approve')
      
      const decimals = 18
      const amountWei = parseUnits(betAmount, decimals)
      
      await writeContract({
        address: HYPE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS, amountWei],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Don't show error for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        // User cancelled - silently return
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      showError(
        'Please check your wallet and try again. Make sure you have sufficient funds for gas fees.',
        'Failed to Approve Tokens'
      )
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null || isWritePending) return

    try {
      setIsSubmitting(true)
      setCurrentTxType('placeBet')
      
      const decimals = 18
      const amountWei = parseUnits(betAmount, decimals)
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'placeBet',
        args: [BigInt(numericBetId), selectedOption, amountWei],
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        // User cancelled - silently return
        setIsSubmitting(false)
        setCurrentTxType(null)
        return
      }
      
      showError(
        'Your tokens may not be approved or you might have insufficient balance. Please try again.',
        'Failed to Place Bet'
      )
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handleClaimWinnings = async () => {
    if (isWritePending) return

    try {
      setIsSubmitting(true)
      setCurrentTxType('claimWinnings')
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimWinnings',
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
      
      showError(
        'You may have already claimed your winnings or the bet is not yet resolved.',
        'Failed to Claim Winnings'
      )
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  const handleResolveBet = async (winningOptionIndex: number) => {
    if (isWritePending) return

    try {
      setIsSubmitting(true)
      setCurrentTxType('resolveBet')
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'resolveBet',
        args: [BigInt(numericBetId), winningOptionIndex],
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
        'Only the bet creator can resolve this bet. Make sure the betting period has ended.',
        'Failed to Resolve Bet'
      )
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }

  // === TRANSACTION SUCCESS MONITORING (like useBetCreation) ===
  useEffect(() => {
    if (isConfirmed && receipt && currentTxType) {
      // Transaction successfully mined - handle based on type
      
      switch (currentTxType) {
        case 'approve':
          queryClient.invalidateQueries({ queryKey: ['allowance'] })
          showSuccess('You can now place your bet', 'Tokens Approved!')
          break
          
        case 'placeBet':
          queryClient.invalidateQueries({ queryKey: ['bet', numericBetId] })
          queryClient.invalidateQueries({ queryKey: ['userBets', numericBetId] })
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          setBetAmount('') // Only clear on successful confirmation
          setJustPlacedBet(true)
          showSuccess('Your transaction has been confirmed', 'Bet Placed!')
          
          // Reset success state after 3 seconds
          setTimeout(() => {
            setJustPlacedBet(false)
          }, 3000)
          break
          
        case 'claimWinnings':
          queryClient.invalidateQueries({ queryKey: ['balance'] })
          queryClient.invalidateQueries({ queryKey: ['claimed', numericBetId] })
          showSuccess('Your winnings have been transferred to your wallet', 'Winnings Claimed!')
          break
          
        case 'resolveBet':
          queryClient.invalidateQueries({ queryKey: ['bet', numericBetId] })
          showSuccess('The bet outcome has been recorded', 'Bet Resolved!')
          break
      }
      
      // Reset transaction state
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }, [isConfirmed, receipt, currentTxType, queryClient, numericBetId, showSuccess])

  // Handle write errors
  useEffect(() => {
    if (writeError && currentTxType) {
      setIsSubmitting(false)
      setCurrentTxType(null)
    }
  }, [writeError, currentTxType])

  return {
    // State
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    justPlacedBet,
    
    // Loading states - unified and reliable
    isPending: (currentTxType === 'placeBet' && (isWritePending || isConfirming)) || isSubmitting,
    isApproving: (currentTxType === 'approve' && (isWritePending || isConfirming)) || 
                 (currentTxType === 'approve' && isSubmitting),
    isClaiming: (currentTxType === 'claimWinnings' && (isWritePending || isConfirming)) || 
                (currentTxType === 'claimWinnings' && isSubmitting),
    
    // Actions
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    
    // Transaction state for debugging
    txHash,
    isWritePending,
    isConfirming,
    currentTxType,
  }
}