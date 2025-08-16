// frontend/app/bets/[id]/hooks/useBetDataNew.ts
// New Privacy-Focused Bet Data Hook
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { BETLEY_NEW_ABI } from '@/lib/contractABI'
import { contractsConfig } from '@/lib/config'
import { ERC20_ABI } from '@/lib/erc20ABI'
import { isNativeETH } from '@/lib/tokenUtils'

interface UseBetDataNewOptions {
  useReactQuery?: boolean
}

// Type for database bet details
interface DatabaseBetDetails {
  numericId: number
  name: string
  options: string[]
  creator: string
  optionCount: number
  tokenAddress: string
  endTime: number
  createdAt: string
  resolved: boolean
  winningOption: number | null
  resolutionDeadline: number
  totalAmounts: number[]
  isPublic: boolean
  canAccess: boolean
  isActive: boolean
  hasEnded: boolean
}

// Type for blockchain basic data
type BlockchainBasics = readonly [
  `0x${string}`,      // creator
  bigint,             // endTime
  boolean,            // resolved
  number,             // winningOption
  number,             // optionCount
  `0x${string}`       // token
]

export function useBetDataNew(randomId: string, options: UseBetDataNewOptions = {}) {
  const { useReactQuery = true } = options
  const { address } = useAccount()
  const [timeLeft, setTimeLeft] = useState(0)
  const [resolutionTimeLeft, setResolutionTimeLeft] = useState(0)
  const [resolutionDeadlinePassed, setResolutionDeadlinePassed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Manual refresh function
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // === DATABASE QUERY - Get sensitive bet details ===
  const { 
    data: databaseBet, 
    isLoading: isDatabaseLoading, 
    error: databaseError 
  } = useQuery({
    queryKey: ['bet-details-new', randomId],
    queryFn: async (): Promise<DatabaseBetDetails> => {
      const response = await fetch(`/api/bets/${randomId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bet not found')
        }
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    },
    enabled: !!randomId && randomId.length === 8,
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: 2
  })

  const numericBetId = databaseBet?.numericId
  const tokenAddress = databaseBet?.tokenAddress
  const isNativeBet = tokenAddress ? isNativeETH(tokenAddress) : false

  // === BLOCKCHAIN QUERIES - Get operational data ===
  
  // Get basic bet info (resolution status, etc.)
  const { 
    data: betBasics
  } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'getBetBasics',
    args: numericBetId !== undefined ? [BigInt(numericBetId)] : undefined,
    query: {
      refetchInterval: 4000,
      enabled: numericBetId !== undefined
    }
  })

  // Get bet amounts (for TVL display)
  const { 
    data: betAmounts
  } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'getBetAmounts',
    args: numericBetId !== undefined ? [BigInt(numericBetId)] : undefined,
    query: {
      refetchInterval: 4000,
      enabled: numericBetId !== undefined
    }
  })

  // User bets
  const { data: userBets } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'getUserBets',
    args: address && numericBetId !== undefined ? [BigInt(numericBetId), address] : undefined,
    query: {
      refetchInterval: 5000,
      enabled: numericBetId !== undefined && !!address
    }
  })

  // Native balance query
  const { data: nativeBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address && isNativeBet,
      refetchInterval: 8000,
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
    args: address ? [address, contractsConfig.betley] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !isNativeBet,
      refetchInterval: 8000,
    }
  })

  // Has user claimed winnings/refund
  const { data: hasClaimed } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'hasUserClaimed',
    args: address && numericBetId !== undefined ? [BigInt(numericBetId), address] : undefined,
    query: {
      enabled: numericBetId !== undefined && !!address,
      refetchInterval: 10000,
    }
  })

  // Has creator claimed creator fees
  const { data: hasClaimedCreatorFees } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'hasClaimedCreatorFees',
    args: address && numericBetId !== undefined ? [BigInt(numericBetId), address] : undefined,
    query: {
      enabled: numericBetId !== undefined && !!address,
      refetchInterval: 10000,
    }
  })



  // Resolution deadline
  const { data: resolutionDeadline } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_NEW_ABI,
    functionName: 'getResolutionDeadline',
    args: numericBetId !== undefined ? [BigInt(numericBetId)] : undefined,
    query: {
      enabled: numericBetId !== undefined,
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

  // === COMBINE DATABASE + BLOCKCHAIN DATA ===
  
  // Create unified bet details (compatible with old format)
  // Use database data as primary source, blockchain data for real-time amounts
  const betDetails = databaseBet ? [
    databaseBet.name,                    // name (from database)
    databaseBet.options,                 // options (from database)  
    databaseBet.creator as `0x${string}`, // creator (from database)
    BigInt(databaseBet.endTime),         // endTime (from database)
    betBasics ? (betBasics as BlockchainBasics)[2] : databaseBet.resolved, // resolved (blockchain or database)
    betBasics ? (betBasics as BlockchainBasics)[3] : databaseBet.winningOption, // winningOption (blockchain or database)
    betAmounts ? (betAmounts as readonly bigint[]) : databaseBet.totalAmounts.map(n => BigInt(n)), // totalAmounts (blockchain or database)
    databaseBet.tokenAddress as `0x${string}` // token (from database)
  ] as const : undefined

  // === TIME CALCULATIONS ===
  useEffect(() => {
    if (databaseBet?.endTime) {
      const endTime = databaseBet.endTime * 1000
      const now = Date.now()
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)))
    }
  }, [databaseBet?.endTime, refreshTrigger])

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

  // Wait for database, but not blockchain (blockchain data is optional for display)
  const isLoading = isDatabaseLoading
  const error = databaseError || (!databaseBet && !isDatabaseLoading ? new Error('Bet not found') : null)
  


  return {
    // Data (compatible with old useBetData format)
    betDetails,
    userBets,
    ethBalance,
    decimals: isNativeBet ? 18 : decimals,
    hasClaimed,
    hasClaimedCreatorFees,

    resolutionDeadline: resolutionDeadline ? Number(resolutionDeadline) : undefined,
    allowance,
    isNativeBet,
    
    // Loading states
    isBetLoading: isLoading,
    
    // Errors
    betError: error,
    
    // Time-based computed state
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    
    // Manual refresh functions
    refreshAllData,
    triggerRefresh,
    
    // Validation
    isValidBetId: !!databaseBet,
    numericBetId,
    
    // New data from database
    databaseBet,
    
    // Debug info
    usingReactQuery: useReactQuery,
  }
}