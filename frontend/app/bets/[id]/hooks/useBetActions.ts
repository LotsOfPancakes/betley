import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'

interface OptimisticUpdate {
  type: 'approval' | 'bet' | 'resolution' | null
  data?: any
}

export function useBetActions(betId: string, betDetails: any, onRefresh?: () => void) {
  const [betAmount, setBetAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [optimisticUpdate, setOptimisticUpdate] = useState<OptimisticUpdate>({ type: null })

  // Write contracts
  const { 
    data: hash, 
    isPending, 
    writeContract 
  } = useWriteContract()

  const { 
    data: approveHash, 
    isPending: isApproving, 
    writeContract: writeApprove 
  } = useWriteContract()

  // Wait for transactions
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      // Clear optimistic state and refresh data after confirmation
      setOptimisticUpdate({ type: null })
      if (onRefresh) {
        setTimeout(onRefresh, 1000) // Small delay to ensure blockchain state is updated
      }
    }
  }, [isSuccess, onRefresh])

  useEffect(() => {
    if (isApproveSuccess) {
      setOptimisticUpdate({ type: null })
      if (onRefresh) {
        setTimeout(onRefresh, 1000)
      }
    }
  }, [isApproveSuccess, onRefresh])

  // Handle HYPE token approval with optimistic update
  const handleApprove = async () => {
    if (!betAmount) return
    
    try {
      // Optimistic update - assume approval will succeed
      setOptimisticUpdate({ 
        type: 'approval', 
        data: { approved: true } 
      })

      writeApprove({
        address: HYPE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS, parseUnits(betAmount, 18)],
      })
    } catch (error) {
      console.error('Approval error:', error)
      setOptimisticUpdate({ type: null }) // Revert optimistic update
      alert('Failed to approve tokens')
    }
  }

  // Handle placing a bet with optimistic update
  const handlePlaceBet = async () => {
    if (!betAmount || selectedOption === null) return

    try {
      // Optimistic update - assume bet will succeed
      const betAmountBig = parseUnits(betAmount, 18)
      setOptimisticUpdate({ 
        type: 'bet', 
        data: { 
          option: selectedOption, 
          amount: betAmountBig,
          user: 'current' // Flag to identify this is user's bet
        } 
      })

      // Clear bet form immediately for better UX
      setBetAmount('')
      setSelectedOption(null)

      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'placeBet',
        args: [BigInt(betId), selectedOption, betAmountBig],
      })
    } catch (error) {
      console.error('Betting error:', error)
      setOptimisticUpdate({ type: null }) // Revert optimistic update
      alert('Failed to place bet')
    }
  }

  // Handle claiming winnings - faster refresh
  const handleClaimWinnings = async () => {
    try {
      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(betId)],
      })
      
      // Trigger refresh after a short delay (don't wait for full confirmation)
      setTimeout(() => {
        if (onRefresh) onRefresh()
      }, 3000) // 3 seconds should be enough for 2s block time
      
    } catch (error) {
      console.error('Claim error:', error)
      alert('Failed to claim winnings')
    }
  }

  // Handle bet resolution with immediate refresh
  const handleResolveBet = async (winningOptionIndex: number) => {
    try {
      // Optimistic update for resolution
      setOptimisticUpdate({
        type: 'resolution',
        data: { winningOption: winningOptionIndex }
      })

      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'resolveBet',
        args: [BigInt(betId), winningOptionIndex],
      })

      // Refresh after short delay
      setTimeout(() => {
        if (onRefresh) onRefresh()
      }, 3000)

    } catch (error) {
      console.error('Resolution error:', error)
      setOptimisticUpdate({ type: null })
      alert('Failed to resolve bet')
    }
  }

  return {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    isPending: isPending || isConfirming,
    isApproving: isApproving || isApproveConfirming,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    optimisticUpdate, // Expose optimistic state for UI
    isOptimisticallyApproved: optimisticUpdate.type === 'approval',
    optimisticBet: optimisticUpdate.type === 'bet' ? optimisticUpdate.data : null,
    optimisticResolution: optimisticUpdate.type === 'resolution' ? optimisticUpdate.data : null
  }
}