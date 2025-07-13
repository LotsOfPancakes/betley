// frontend/app/bets/[id]/hooks/useBetActions.ts - Fixed version
import { useState, useEffect } from 'react'
import { 
  usePlaceBetMutation,
  useApproveMutation,
  useClaimWinningsMutation,
  useResolveBetMutation
} from '@/lib/queries/betQueries'
import { useNotification } from '@/lib/hooks/useNotification'
import { timeoutsConfig } from '@/lib/config'

export function useBetActions(betId: string) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isApprovalPending, setIsApprovalPending] = useState(false) // Track approval state locally
  const [isSubmitting, setIsSubmitting] = useState(false) // ✅ NEW: Prevent double submissions
  const numericBetId = parseInt(betId)

  // === NOTIFICATION SYSTEM ===
  const { showError, showSuccess } = useNotification()

  // === REACT QUERY MUTATIONS ===
  const resolveBetMutation = useResolveBetMutation(numericBetId)
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
      // ✅ FIXED: No immediate success toast - let user see wallet confirmation
    } catch {
      showError(
        'Please check your wallet and try again. Make sure you have sufficient funds to bet & pay transaction fees.',
        'Failed to Approve Tokens'
      )
      setIsApprovalPending(false) // Reset on error
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null || isSubmitting) return // ✅ FIXED: Prevent double submissions

    try {
      setIsSubmitting(true) // ✅ FIXED: Block rapid clicking
      await placeBetMutation.mutateAsync({ 
        option: selectedOption, 
        amount: betAmount 
      })
      
      // Clear only the bet amount, keep the selected option
      setBetAmount('')
      
      // DON'T set success state here - it will be handled by useEffect
      
      // React Query automatically refetches related data
    } catch {
      showError(
        'Your tokens may not be approved or you might have insufficient balance. Please try again.',
        'Failed to Place Bet'
      )
    } finally {
      setIsSubmitting(false) // ✅ FIXED: Always reset, even on error
    }
  }

  const handleClaimWinnings = async () => {
    try {
      await claimWinningsMutation.mutateAsync()
      // React Query automatically refetches user balance and claim status
      showSuccess('Your winnings have been transferred to your wallet!')
    } catch {
      showError(
        'You may have already claimed your winnings or the bet is not yet resolved.',
        'Failed to Claim Winnings'
      )
    }
  }

  const handleResolveBet = async (winningOptionIndex: number) => {
    try {
      await resolveBetMutation.mutateAsync({ winningOptionIndex })
    } catch {
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
        // ✅ FIXED: Show success only after timeout (when allowance should be updated)
        showSuccess('Token approval successful! You can now place your bet.')
      }, timeoutsConfig.approval)
      
      return () => clearTimeout(timer)
    }
  }, [approveMutation.isSuccess, approveMutation.isPending, showSuccess])

  // Show success message when bet is placed successfully
  useEffect(() => {
    if (placeBetMutation.isSuccess && !placeBetMutation.isPending) {
      setJustPlacedBet(true)
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
    isPending: placeBetMutation.isPending || isSubmitting, // ✅ FIXED: Include isSubmitting
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