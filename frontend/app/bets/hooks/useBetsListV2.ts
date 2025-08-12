// ============================================================================
// File: frontend/app/bets/hooks/useBetsListV2.ts
// Database-first bet list hook (Phase 2)
// Purpose: Eliminate RPC rate limiting by using database queries
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { BetDetails } from '../types/bet.types'
import { BET_CONSTANTS } from '@/lib/constants/bets'
import { useWalletAuth } from '@/lib/auth/WalletAuthContext'

interface DatabaseBetsResponse {
  bets: BetDetails[]
  count: number
  source: string
  message?: string
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
  cachedAt: string
}

export function useBetsListV2() {
  const { address } = useAccount()
  const { getAuthHeader, isAuthenticated } = useWalletAuth()

  return useQuery({
    queryKey: ['user-bets-v2', address, isAuthenticated],
    queryFn: async (): Promise<DatabaseBetsResponse> => {
      if (!address) {
        return { bets: [], count: 0, source: 'none' }
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

      // Convert numbers back to BigInt for frontend compatibility
      const transformedBets = data.bets.map((bet: ApiBetResponse) => ({
        ...bet,
        endTime: BigInt(bet.endTime || 0),
        totalAmounts: (bet.totalAmounts || []).map((amount: number) => BigInt(amount)),
        userTotalBet: BigInt(bet.userTotalBet || 0)
      }))

      return {
        ...data,
        bets: transformedBets
      }
    },
    enabled: !!address && isAuthenticated,
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
    source: data?.source || 'unknown',
    count: data?.count || 0
  }
}