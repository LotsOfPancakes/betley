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
  if (!betAmount || selectedOption === null || isSubmitting) return

  try {
    setIsSubmitting(true)
    
    // ✅ FIXED: Use mutateAsync and await it to prevent double prompts
    await placeBetMutation.mutateAsync({ 
      option: selectedOption, 
      amount: betAmount 
    })
    
    setBetAmount('')
    
  } catch (error: unknown) {
    // ✅ FIXED: Proper error type handling
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Don't show error for user cancellation
    if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
      // User cancelled - don't show error
      return
    }
    
    showError(
      'Your tokens may not be approved or you might have insufficient balance. Please try again.',
      'Failed to Place Bet'
    )
  } finally {
    setIsSubmitting(false) // ✅ Always reset, even on cancellation
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
  // ✅ FIXED: Only show success after transaction is actually mined
  // Don't show immediate success - wait for proper confirmation
  
  // For now, let's remove automatic success toast and let user see wallet confirmation
  // You can add transaction receipt waiting here later if needed
  
}, []) // Empty for now - success will be shown when data refreshes

useEffect(() => {
  if (placeBetMutation.isSuccess && !placeBetMutation.isPending) {
    // ✅ Show success after a delay to ensure transaction is processed
    const timer = setTimeout(() => {
      setJustPlacedBet(true)
      showSuccess('Your bet has been placed successfully! Transaction confirmed.')
      
      // Reset success state after 3 seconds
      const resetTimer = setTimeout(() => {
        setJustPlacedBet(false)
      }, 3000)
      
      return () => clearTimeout(resetTimer)
    }, 2000) // 2 second delay like approval
    
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