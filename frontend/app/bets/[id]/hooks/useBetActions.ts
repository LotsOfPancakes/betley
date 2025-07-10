// frontend/app/bets/[id]/hooks/useBetActions.ts (UPDATED)
import { useState } from 'react'
import { 
  usePlaceBetMutation,
  useApproveMutation,
  useClaimWinningsMutation 
} from '@/lib/queries/betQueries'

export function useBetActions(betId: string, onRefresh?: () => void) {
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const numericBetId = parseInt(betId)

  // === REACT QUERY MUTATIONS ===
  const placeBetMutation = usePlaceBetMutation(numericBetId)
  const approveMutation = useApproveMutation()
  const claimWinningsMutation = useClaimWinningsMutation(numericBetId)

  // === ACTION HANDLERS ===
  const handleApprove = async () => {
    if (!betAmount) return
    
    try {
      await approveMutation.mutateAsync({ amount: betAmount })
      // React Query automatically invalidates allowance queries
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve tokens')
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null) return

    try {
      await placeBetMutation.mutateAsync({ 
        option: selectedOption, 
        amount: betAmount 
      })
      
      // Clear form on success
      setBetAmount('')
      setSelectedOption(null)
      
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

  return {
    // Form state
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    
    // Loading states (automatically managed by React Query)
    isPending: placeBetMutation.isPending,
    isApproving: approveMutation.isPending,
    
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