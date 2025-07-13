// frontend/app/bets/[id]/hooks/useBetActions.ts
import { useState, useEffect } from 'react'
import { 
  usePlaceBetMutation,
  useApproveMutation,
  useClaimWinningsMutation 
} from '@/lib/queries/betQueries'
import { useNotification } from '@/lib/hooks/useNotification'
import { timeoutsConfig } from '@/lib/config'

// FIXED: Removed unused 'onRefresh' parameter
export function useBetActions(betId: string) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isApprovalPending, setIsApprovalPending] = useState(false) // Track approval state locally
  const numericBetId = parseInt(betId)

  // === NOTIFICATION SYSTEM ===
  const { showError, showSuccess } = useNotification()

  // === REACT QUERY MUTATIONS ===
  const placeBetMutation = usePlaceBetMutation(numericBetId)
  const approveMutation = useApproveMutation()
  const claimWinningsMutation = useClaimWinningsMutation(numericBetId)

  // === ACTION HANDLERS ===
  const handleApprove = async () => {
    if (!betAmount) return
    
    try {
      setIsApprovalPending(true) // Start local pending state
      await approveMutation.mutateAsync({ amount: betAmount })
      // Keep isApprovalPending true until allowance updates
    } catch {
      // FIXED: Removed unused 'error' parameter - no longer needed since we're using notifications
      showError(
        'Please check your wallet and try again. Make sure you have sufficient funds to bet & pay transaction fees.',
        'Failed to Approve Tokens'
      )
      setIsApprovalPending(false) // Reset on error
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null) return

    try {
      await placeBetMutation.mutateAsync({ 
        option: selectedOption, 
        amount: betAmount 
      })
      
      // Clear only the bet amount, keep the selected option
      setBetAmount('')
      
      // DON'T set success state here - it will be handled by useEffect
      
      // React Query automatically refetches related data
    } catch {
      // FIXED: Removed unused 'error' parameter - no longer needed since we're using notifications
      showError(
        'Your tokens may not be approved or you might have insufficient balance. Please try again.',
        'Failed to Place Bet'
      )
    }
  }

  const handleClaimWinnings = async () => {
    try {
      await claimWinningsMutation.mutateAsync()
      // React Query automatically refetches user balance and claim status
      showSuccess('Your winnings have been transferred to your wallet!')
    } catch {
      // FIXED: Removed unused 'error' parameter - no longer needed since we're using notifications
      showError(
        'You may have already claimed your winnings or the bet is not yet resolved.',
        'Failed to Claim Winnings'
      )
    }
  }

  // FIXED: Removed unused 'winningOptionIndex' parameter since function is not implemented yet
  const handleResolveBet = async () => {
    try {
      // You can create a separate mutation for this if needed
      // For now, keeping the existing pattern
      // Implementation would go here when resolution feature is added
    } catch {
      // FIXED: Removed unused 'error' parameter - no longer needed since we're using notifications
      showError(
        'Only the bet creator can resolve this bet. Make sure the betting period has ended.',
        'Failed to Resolve Bet'
      )
    }
  }

  // Reset approval pending when mutation succeeds AND wait for allowance to update
  useEffect(() => {
    if (approveMutation.isSuccess && !approveMutation.isPending) {
      // UPDATED: Use configurable approval timeout from config
      const timer = setTimeout(() => {
        setIsApprovalPending(false)
      }, timeoutsConfig.approval)
      
      return () => clearTimeout(timer)
    }
  }, [approveMutation.isSuccess, approveMutation.isPending])

  // Show success message when bet is placed successfully
  useEffect(() => {
    if (placeBetMutation.isSuccess && !placeBetMutation.isPending) {
      setJustPlacedBet(true)
      // ✅ ENHANCED: Better success messaging
      showSuccess('Your bet has been placed successfully!')
      
      // Reset success state after 3 seconds
      const timer = setTimeout(() => {
        setJustPlacedBet(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [placeBetMutation.isSuccess, placeBetMutation.isPending, showSuccess])

  return {
    // State
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    justPlacedBet,
    
    // Loading states
    isPending: placeBetMutation.isPending,
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