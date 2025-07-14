// frontend/app/bets/[id]/hooks/useBetData.ts - Fixed with native balance support
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'
import { isNativeHype } from '@/lib/tokenUtils'
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

  // 🔧 FIX: Get token address from raw data BEFORE using it
  const rawBetDetails = useReactQuery ? reactQueryBetDetails.data : fallbackBetDetails.data
  const tokenAddress = rawBetDetails?.[7] as string
  const isNativeBet = tokenAddress ? isNativeHype(tokenAddress) : false

  // 🔧 NEW: Native balance query (for native HYPE)
  const { data: nativeBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address && isNativeBet,
      refetchInterval: 8000,
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

  // 🔧 UPDATED: ERC20 balance query (only for ERC20 tokens)
  const fallbackERC20Balance = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 8000,
      enabled: !!address && !useReactQuery && !isNativeBet // Only for ERC20 tokens
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
  const betDetails = rawBetDetails // Use the data we already fetched
  const userBets = useReactQuery ? reactQueryUserBets.data : fallbackUserBets.data  
  
  // 🔧 NEW: Smart balance selection based on token type
  const hypeBalance = isNativeBet 
    ? nativeBalance?.value // Use native balance for native HYPE
    : (useReactQuery ? reactQueryBalance.data : fallbackERC20Balance.data) // Use ERC20 balance for ERC20 tokens
    
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
      enabled: numericBetId !== null,
      staleTime: 30000,
    }
  })

  // === TIME CALCULATIONS ===
  useEffect(() => {
    if (betDetails && betDetails[3]) {
      const endTime = Number(betDetails[3]) * 1000
      const now = Date.now()
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)))
    }
  }, [betDetails, refreshTrigger])

  useEffect(() => {
    if (resolutionDeadline) {
      const deadline = Number(resolutionDeadline) * 1000
      const now = Date.now()
      setResolutionTimeLeft(Math.max(0, Math.floor((deadline - now) / 1000)))
      setResolutionDeadlinePassed(now > deadline)
    }
  }, [resolutionDeadline, refreshTrigger])

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Manual refresh all data
  const refreshAllData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    // Could also manually refetch specific queries here if needed
  }, [])

  // Validation error for invalid bet IDs
  const validationError = !isValidBetId ? 
    new Error(`Invalid bet ID: "${betId}". Bet IDs must be numbers.`) : null

  return {
    // Data
    betDetails,
    userBets,
    hypeBalance, // Now correctly shows native or ERC20 balance
    decimals,
    hasClaimed,
    resolutionDeadline,
    allowance,
    isNativeBet, // 🔧 NEW: Export this so components know token type
    
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