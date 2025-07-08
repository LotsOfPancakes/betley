// hooks/useBetData.ts
import { useReadContract, useAccount } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'

export function useBetData(betId: string) {
  const { address } = useAccount()
  const [timeLeft, setTimeLeft] = useState(0)
  const [resolutionTimeLeft, setResolutionTimeLeft] = useState(0)
  const [resolutionDeadlinePassed, setResolutionDeadlinePassed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Validate bet ID - must be a valid number (since we're now passing numeric IDs)
  const isValidBetId = betId && !isNaN(parseInt(betId)) && parseInt(betId) >= 0
  const numericBetId = isValidBetId ? parseInt(betId) : null

  // Manual refresh function
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Read bet details with refresh trigger
  const { 
    data: betDetails, 
    isLoading: isBetLoading, 
    error: betError,
    refetch: refetchBetDetails
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: numericBetId !== null ? [BigInt(numericBetId)] : undefined,
    query: {
      // Refresh every 4 seconds for active bets, 10s for others
      refetchInterval: 4000,
      enabled: numericBetId !== null // Only run if bet ID is valid
    }
  })

  // Read user's bets with refresh trigger
  const { 
    data: userBets,
    refetch: refetchUserBets 
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 5000, // Check user bets every 5 seconds
      enabled: numericBetId !== null && !!address
    }
  })

  // Read user's HYPE balance
  const { 
    data: hypeBalance,
    refetch: refetchBalance 
  } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 8000, // Check balance every 8 seconds
      enabled: !!address
    }
  })

  // Read token decimals (static, no need to refresh)
  const { data: decimals } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  // Check if user has claimed winnings/refund
  const { 
    data: hasClaimed,
    refetch: refetchHasClaimed 
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 6000,
      enabled: numericBetId !== null && !!address
    }
  })

  // Get resolution deadline
  const { data: resolutionDeadline } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getResolutionDeadline',
    args: numericBetId !== null ? [BigInt(numericBetId)] : undefined,
    query: {
      enabled: numericBetId !== null
    }
  })

  // Read user's allowance for HYPE token
  const { 
    data: allowance,
    refetch: refetchAllowance 
  } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETLEY_ADDRESS] : undefined,
    query: {
      refetchInterval: 7000,
      enabled: !!address
    }
  })

  // Manual refresh all data
  const refreshAllData = useCallback(() => {
    if (numericBetId !== null) {
      refetchBetDetails()
      refetchUserBets()
      refetchBalance()
      refetchHasClaimed()
      refetchAllowance()
    }
  }, [numericBetId, refetchBetDetails, refetchUserBets, refetchBalance, refetchHasClaimed, refetchAllowance])

  // Update time-based states
  useEffect(() => {
    const updateTimes = () => {
      const now = Math.floor(Date.now() / 1000)
      
      if (betDetails && betDetails[3]) {
        const endTime = Number(betDetails[3])
        setTimeLeft(Math.max(0, endTime - now))
      }

      if (resolutionDeadline) {
        const deadline = Number(resolutionDeadline)
        const timeUntilDeadline = Math.max(0, deadline - now)
        setResolutionTimeLeft(timeUntilDeadline)
        setResolutionDeadlinePassed(timeUntilDeadline === 0)
      }
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [betDetails, resolutionDeadline])

  // Trigger refresh when external trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshAllData()
    }
  }, [refreshTrigger, refreshAllData])

  // Custom error for invalid bet ID
  const validationError = !isValidBetId ? new Error(`Invalid bet ID: "${betId}". Bet IDs must be numbers.`) : null

  return {
    betDetails,
    userBets,
    hypeBalance,
    decimals,
    hasClaimed,
    resolutionDeadline,
    allowance,
    isBetLoading: numericBetId === null ? false : isBetLoading,
    betError: validationError || betError,
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    refreshAllData, // Expose manual refresh function
    triggerRefresh,
    isValidBetId,
    numericBetId
  }
}