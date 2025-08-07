// ============================================================================
// File: frontend/app/bets/hooks/useBetsListV2.ts
// Database-first bet list hook (Phase 2)
// Purpose: Eliminate RPC rate limiting by using database queries
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { BetDetails } from '../types/bet.types'
import { BET_CONSTANTS } from '@/lib/constants/bets'

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

  return useQuery({
    queryKey: ['user-bets-v2', address],
    queryFn: async (): Promise<DatabaseBetsResponse> => {
      if (!address) {
        return { bets: [], count: 0, source: 'none' }
      }

      const response = await fetch('/api/bets/user-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user bets: ${response.status}`)
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
    enabled: !!address,
    staleTime: BET_CONSTANTS.timeouts.staleTime,
    refetchInterval: BET_CONSTANTS.timeouts.refetchInterval,
    retry: BET_CONSTANTS.retry.maxAttempts,
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