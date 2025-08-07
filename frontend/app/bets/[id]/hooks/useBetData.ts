// frontend/app/bets/[id]/hooks/useBetData.ts
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS, ERC20_ABI } from '@/lib/contractABI'
import { isNativeETH } from '@/lib/tokenUtils'

interface UseBetDataOptions {
  useReactQuery?: boolean
}

// Type for contract response
type BetDetailsArray = readonly [
  string,              // name
  readonly string[],   // options  
  `0x${string}`,      // creator
  bigint,             // endTime
  boolean,            // resolved
  number,             // winningOption
  readonly bigint[],  // totalAmounts
  `0x${string}`       // token address
]

export function useBetData(betId: string, options: UseBetDataOptions = {}) {
  const { useReactQuery = true } = options
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

  // === CONTRACT CALLS ===
  
  // Main bet details
  const { 
    data: betDetails, 
    isLoading: isBetLoading, 
    error: betError 
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: numericBetId !== null ? [BigInt(numericBetId)] : undefined,
    query: {
      refetchInterval: 4000,
      enabled: numericBetId !== null
    }
  })

  // Extract token address from bet details
  const tokenAddress = (betDetails as BetDetailsArray)?.[7] as string
  const isNativeBet = tokenAddress ? isNativeETH(tokenAddress) : false

  // Native balance query
  const { data: nativeBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address && isNativeBet,
      refetchInterval: 8000,
    }
  })

  // User bets
  const { data: userBets } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 5000,
      enabled: numericBetId !== null && !!address
    }
  })

  // ERC20 balance (for non-native tokens)
  const { data: erc20Balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !isNativeBet,
      refetchInterval: 8000,
    }
  })

  // ERC20 allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETLEY_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !isNativeBet,
      refetchInterval: 8000,
    }
  })

  // Has user claimed winnings/refund
  const { data: hasClaimed } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      enabled: numericBetId !== null && !!address,
      refetchInterval: 10000,
    }
  })

  // Has user claimed creator fees (separate from winnings/refund)
  const { data: hasClaimedCreatorFees } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasClaimedCreatorFees',
    args: address && numericBetId !== null ? [BigInt(numericBetId), address] : undefined,
    query: {
      enabled: numericBetId !== null && !!address,
      refetchInterval: 10000,
    }
  })

  // Resolution deadline
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

  // Choose correct balance based on token type
  const ethBalance = isNativeBet ? nativeBalance?.value : erc20Balance

  // Decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress && !isNativeBet,
      staleTime: Infinity, // Decimals never change
    }
  })

  // === TIME CALCULATIONS ===
  useEffect(() => {
    if (betDetails && (betDetails as BetDetailsArray)[3]) {
      const endTime = Number((betDetails as BetDetailsArray)[3]) * 1000
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
  }, [])

  // Validation error for invalid bet IDs
  const validationError = !isValidBetId ? 
    new Error(`Invalid bet ID: "${betId}". Bet IDs must be numbers.`) : null

  return {
    // Data
    betDetails,
    userBets,
    ethBalance,
    decimals: isNativeBet ? 18 : decimals, // Native ETH has 18 decimals
    hasClaimed,
    hasClaimedCreatorFees, // NEW: Add creator fee claim status
    resolutionDeadline: resolutionDeadline ? Number(resolutionDeadline) : undefined,
    allowance,
    isNativeBet, // Export this so components know token type
    
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

