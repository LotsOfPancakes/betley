// frontend/app/bets/[id]/hooks/useBetActions.ts - FIXED VERSION
import { useState, useEffect } from 'react'
import { useWaitForTransactionReceipt } from 'wagmi'
import { 
  usePlaceBetMutation,
  useApproveMutation,
  useClaimWinningsMutation,
  useResolveBetMutation
} from '@/lib/queries/betQueries'
import { useNotification } from '@/lib/hooks/useNotification'

export function useBetActions(betId: string) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isApprovalPending, setIsApprovalPending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const numericBetId = parseInt(betId)

  // === NOTIFICATION SYSTEM ===
  const { showError, showSuccess } = useNotification()

  // === REACT QUERY MUTATIONS ===
  const resolveBetMutation = useResolveBetMutation(numericBetId)
  const placeBetMutation = usePlaceBetMutation(numericBetId)
  const approveMutation = useApproveMutation()
  const claimWinningsMutation = useClaimWinningsMutation(numericBetId)

  // === TRANSACTION RECEIPT MONITORING ===
  // Wait for place bet transaction to be mined
  const { data: placeBetReceipt } = useWaitForTransactionReceipt({
    hash: placeBetMutation.data as `0x${string}` | undefined,
  })

  // Wait for approval transaction to be mined
  const { data: approvalReceipt } = useWaitForTransactionReceipt({
    hash: approveMutation.data as `0x${string}` | undefined,
  })

  // === ACTION HANDLERS ===
  const handleApprove = async () => {
    if (!betAmount) return
    
    try {
      setIsApprovalPending(true)
      await approveMutation.mutateAsync({ amount: betAmount })
      // Keep isApprovalPending true until transaction is mined
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Don't show error for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) { // MetaMask rejection code
        // User cancelled - silently return
        setIsApprovalPending(false)
        return
      }
      
      showError(
        'Please check your wallet and try again. Make sure you have sufficient funds to bet & pay transaction fees.',
        'Failed to Approve Tokens'
      )
      setIsApprovalPending(false)
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      await placeBetMutation.mutateAsync({ 
        option: selectedOption, 
        amount: betAmount 
      })
      
      // Only clear amount if transaction was successful (no exception thrown)
      setBetAmount('')
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for user cancellation - be more comprehensive
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) { // MetaMask rejection code
        // User cancelled - silently return without any action or error message
        return
      }
      
      // Only show error for actual failures, not cancellations
      showError(
        'Your tokens may not be approved or you might have insufficient balance. Please try again.',
        'Failed to Place Bet'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaimWinnings = async () => {
    try {
      await claimWinningsMutation.mutateAsync()
      showSuccess('Your winnings have been transferred to your wallet!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Don't show error for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        return
      }
      
      showError(
        'You may have already claimed your winnings or the bet is not yet resolved.',
        'Failed to Claim Winnings'
      )
    }
  }

  const handleResolveBet = async (winningOptionIndex: number) => {
    try {
      await resolveBetMutation.mutateAsync({ winningOptionIndex })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Don't show error for user cancellation
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.includes('4001')) {
        return
      }
      
      showError(
        'Only the bet creator can resolve this bet. Make sure the betting period has ended.',
        'Failed to Resolve Bet'
      )
    }
  }

  // === TRANSACTION SUCCESS MONITORING ===
  
  // Handle approval success - wait for actual transaction confirmation
  useEffect(() => {
    if (approvalReceipt && approveMutation.isSuccess) {
      // Now the approval transaction is actually mined
      setIsApprovalPending(false)
      showSuccess('Token approval successful! You can now place your bet.')
    }
  }, [approvalReceipt, approveMutation.isSuccess, showSuccess])

  // Handle place bet success - wait for actual transaction confirmation
  useEffect(() => {
    if (placeBetReceipt && placeBetMutation.isSuccess) {
      // Now the bet transaction is actually mined
      setJustPlacedBet(true)
      showSuccess('Your bet has been placed successfully! Transaction confirmed.')
      
      // Reset success state after 3 seconds
      const resetTimer = setTimeout(() => {
        setJustPlacedBet(false)
      }, 3000)
      
      return () => clearTimeout(resetTimer)
    }
  }, [placeBetReceipt, placeBetMutation.isSuccess, showSuccess])

  return {
    // State
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    justPlacedBet,
    
    // Loading states
    isPending: placeBetMutation.isPending || isSubmitting,
    isApproving: approveMutation.isPending || isApprovalPending,
    isClaiming: claimWinningsMutation.isPending,
    
    // Actions
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    
    // Mutation objects for advanced usage
    placeBetMutation,
    approveMutation,
    claimWinningsMutation,
  }
}