// frontend/app/bets/[id]/hooks/useBetActions.ts
import { useState, useEffect } from 'react'
import { 
  usePlaceBetMutation,
  useApproveMutation,
  useClaimWinningsMutation 
} from '@/lib/queries/betQueries'

export function useBetActions(betId: string, onRefresh?: () => void) {
  const [justPlacedBet, setJustPlacedBet] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isApprovalPending, setIsApprovalPending] = useState(false) // Track approval state locally
  const numericBetId = parseInt(betId)

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
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve tokens')
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
  } catch (error) {
    console.error('Betting error:', error)
    alert('Failed to place bet')
  }
}

  const handleClaimWinnings = async () => {
    try {
      await claimWinningsMutation.mutateAsync()
      // React Query automatically refetches user balance and claim status
    } catch (error) {
      console.error('Claim error:', error)
      alert('Failed to claim winnings')
    }
  }

  const handleResolveBet = async (winningOptionIndex: number) => {
    try {
      // You can create a separate mutation for this if needed
      // For now, keeping the existing pattern
      console.log('Resolving bet with option:', winningOptionIndex)
      // Implement resolution mutation here
    } catch (error) {
      console.error('Resolution error:', error)
      alert('Failed to resolve bet')
    }
  }

  // Reset approval pending when mutation succeeds AND wait for allowance to update
  useEffect(() => {
    if (approveMutation.isSuccess && !approveMutation.isPending) {
      // Give allowance query time to update (8 seconds should be enough for blockchain + refetch)
      const timer = setTimeout(() => {
        setIsApprovalPending(false)
      }, 8000)
      
      return () => clearTimeout(timer)
    }
  }, [approveMutation.isSuccess, approveMutation.isPending])

  // Show success message when bet is successfully confirmed
useEffect(() => {
  if (placeBetMutation.isSuccess && !placeBetMutation.isPending) {
    setJustPlacedBet(true)
    const timer = setTimeout(() => {
      setJustPlacedBet(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }
}, [placeBetMutation.isSuccess, placeBetMutation.isPending])
  return {

    // Form state
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    
    // Loading states (combine React Query + local state for proper approval flow)
    isPending: placeBetMutation.isPending,
    isApproving: approveMutation.isPending || isApprovalPending, // Combine both states
    justPlacedBet, 

    
    // Action handlers
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    
    // Optimistic state (React Query handles this automatically)
    isOptimisticallyApproved: approveMutation.isSuccess,
    
    // Mutation objects for advanced usage
    placeBetMutation,
    approveMutation,
    claimWinningsMutation,
  }
}