// ============================================================================
// File: frontend/app/bets/hooks/useBetsListV2.ts
// Database-first bet list hook (Phase 2)
// Purpose: Eliminate RPC rate limiting by using database queries
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { PrivateBet } from '../types/bet.types'
import { BET_CONSTANTS } from '@/lib/constants/bets'
import { useWalletAuth } from '@/lib/auth/WalletAuthContext'

interface DatabaseBetsResponse {
  bets: PrivateBet[] // ✅ Use unified format
  count: number
}

interface ApiBetResponse {
  id: number
  randomId: string
  name: string
  options: string[]
  creator: string
  endTime: number
  resolved: boolean
  winningOption: number
  totalAmounts: number[]
  userRole: 'creator' | 'bettor' | 'both'
  userTotalBet: number
  isPublic: boolean
}

export function useBetsListV2() {
  const { address } = useAccount()
  const { getAuthHeader, isAuthenticated, isInitialized } = useWalletAuth()

  return useQuery({
    queryKey: ['user-bets-v2', address, isAuthenticated],
    queryFn: async (): Promise<DatabaseBetsResponse> => {
      if (!address) {
        return { bets: [], count: 0 }
      }

      const authHeader = getAuthHeader()
      if (!authHeader) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/bets/user-bets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ address })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed')
        }
        throw new Error(errorData.error || `Failed to fetch user bets: ${response.status}`)
      }

      const data = await response.json()

      // ✅ Transform to unified PrivateBet format (no BigInt conversion)
      const transformedBets = data.bets.map((bet: ApiBetResponse): PrivateBet => ({
        id: bet.id,
        randomId: bet.randomId,
        name: bet.name,
        options: bet.options,
        creator: bet.creator,
        endTime: bet.endTime || 0,
        resolved: bet.resolved,
        winningOption: bet.winningOption,
        totalAmounts: bet.totalAmounts || [],
        userRole: bet.userRole,
        userTotalBet: bet.userTotalBet || 0,
        isPublic: bet.isPublic,
        token: undefined // Optional field for legacy compatibility
      }))

      return {
        ...data,
        bets: transformedBets
      }
    },
    enabled: !!address && isInitialized && isAuthenticated,
    staleTime: BET_CONSTANTS.timeouts.staleTime,
    refetchInterval: BET_CONSTANTS.timeouts.refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes('Authentication')) return false
      return failureCount < BET_CONSTANTS.retry.maxAttempts
    },
    retryDelay: (attemptIndex) => Math.min(
      BET_CONSTANTS.retry.baseDelay * 2 ** attemptIndex, 
      BET_CONSTANTS.retry.maxDelay
    )
  })
}

// Wrapper hook that provides the same interface as the original useBetsList
export function useBetsListDatabase() {
  const { data, isLoading, isFetching, error, refetch } = useBetsListV2()

  return {
    bets: data?.bets || [],
    loading: isLoading,
    fetching: isFetching,
    error: error?.message || null,
    decimals: BET_CONSTANTS.defaults.decimals,
    retryAttempt: BET_CONSTANTS.defaults.retryAttempt,
    refreshBets: refetch,
    count: data?.count || 0
  }
}