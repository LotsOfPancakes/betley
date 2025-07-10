// frontend/app/bets/[id]/hooks/useBetData.ts (ENHANCED VERSION)
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'
// Optional: Use React Query hooks if available
import { 
  useBetDetailsQuery, 
  useUserBetsQuery, 
  useUserBalanceQuery, 
  useUserAllowanceQuery,
  useUserClaimedQuery 
} from '@/lib/queries/betQueries'

interface UseBetDataOptions {
  useReactQuery?: boolean // Flag to enable/disable React Query features
}

export function useBetData(betId: string, options: UseBetDataOptions = {}) {
  const { useReactQuery = true } = options // Default to using React Query
  const { address } = useAccount()
  const [timeLeft, setTimeLeft] = useState(0)
  const [resolutionTimeLeft, setResolutionTimeLeft] = useState(0)
  const [resolutionDeadlinePassed, setResolutionDeadlinePassed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Validate bet ID
  const isValidBetId = betId && !isNaN(parseInt(betId)) && parseInt(betId) >= 0
  const numericBetId = isValidBetId ? parseInt(betId) : null

  // Manual refresh function
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // === REACT QUERY HOOKS (Enhanced) ===
  const reactQueryBetDetails = useBetDetailsQuery(numericBetId || -1)
  const reactQueryUserBets = useUserBetsQuery(numericBetId || -1, address)
  const reactQueryBalance = useUserBalanceQuery(address)
  const reactQueryAllowance = useUserAllowanceQuery(address)
  const reactQueryClaimed = useUserClaimedQuery(numericBetId || -1, address)

  // === FALLBACK HOOKS (Your existing logic) ===
  const fallbackBetDetails = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: numericBetId !== null ? [BigInt(numericBetId)] : undefined,
    query: {
      refetchInterval: 4000,
      enabled: numericBetId !== null && !useReactQuery // Only use if React Query disabled
    }
  })

  const fallbackUserBets = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 5000,
      enabled: numericBetId !== null && !!address && !useReactQuery
    }
  })

  const fallbackBalance = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 8000,
      enabled: !!address && !useReactQuery
    }
  })

  const fallbackAllowance = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETLEY_ADDRESS] : undefined,
    query: {
      refetchInterval: 7000,
      enabled: !!address && !useReactQuery
    }
  })

  const fallbackClaimed = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 6000,
      enabled: numericBetId !== null && !!address && !useReactQuery
    }
  })

  // === CHOOSE DATA SOURCE ===
  const betDetails = useReactQuery ? reactQueryBetDetails.data : fallbackBetDetails.data
  const userBets = useReactQuery ? reactQueryUserBets.data : fallbackUserBets.data  
  const hypeBalance = useReactQuery ? reactQueryBalance.data : fallbackBalance.data
  const allowance = useReactQuery ? reactQueryAllowance.data : fallbackAllowance.data
  const hasClaimed = useReactQuery ? reactQueryClaimed.data : fallbackClaimed.data

  const isBetLoading = useReactQuery ? 
    reactQueryBetDetails.isLoading : 
    fallbackBetDetails.isLoading

  const betError = useReactQuery ? 
    reactQueryBetDetails.error : 
    fallbackBetDetails.error

  // === STATIC DATA (Same for both approaches) ===
  const { data: decimals } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      staleTime: Infinity, // Decimals never change
    }
  })

  const { data: resolutionDeadline } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getResolutionDeadline',
    args: numericBetId !== null ? [BigInt(numericBetId)] : undefined,
    query: {
      enabled: numericBetId !== null
    }
  })

  // === MANUAL REFRESH (Works with both approaches) ===
  const refreshAllData = useCallback(() => {
    if (numericBetId !== null) {
      if (useReactQuery) {
        // React Query refetch
        reactQueryBetDetails.refetch()
        reactQueryUserBets.refetch()
        reactQueryBalance.refetch()
        reactQueryAllowance.refetch()
        reactQueryClaimed.refetch()
      } else {
        // Fallback refetch
        fallbackBetDetails.refetch()
        fallbackUserBets.refetch()
        fallbackBalance.refetch()
        fallbackAllowance.refetch()
        fallbackClaimed.refetch()
      }
    }
  }, [
    numericBetId, 
    useReactQuery,
    reactQueryBetDetails, reactQueryUserBets, reactQueryBalance, reactQueryAllowance, reactQueryClaimed,
    fallbackBetDetails, fallbackUserBets, fallbackBalance, fallbackAllowance, fallbackClaimed
  ])

  // === TIME-BASED STATE (Same for both) ===
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
  const validationError = !isValidBetId ? 
    new Error(`Invalid bet ID: "${betId}". Bet IDs must be numbers.`) : null

  return {
    // Data
    betDetails,
    userBets,
    hypeBalance,
    decimals,
    hasClaimed,
    resolutionDeadline,
    allowance,
    
    // Loading states
    isBetLoading: numericBetId === null ? false : isBetLoading,
    
    // Errors
    betError: validationError || betError,
    
    // Time-based computed state
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    
    // Manual refresh functions
    refreshAllData,
    triggerRefresh,
    
    // Validation
    isValidBetId,
    numericBetId,
    
    // Debug info
    usingReactQuery: useReactQuery,
  }
}