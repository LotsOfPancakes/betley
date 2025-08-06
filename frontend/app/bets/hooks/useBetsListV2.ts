// ============================================================================
// File: frontend/app/bets/hooks/useBetsListV2.ts
// Database-first bet list hook (Phase 2)
// Purpose: Eliminate RPC rate limiting by using database queries
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { BetDetails } from '../types/bet.types'

interface DatabaseBetsResponse {
  bets: BetDetails[]
  count: number
  source: string
  message?: string
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

      return response.json()
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds (database is fast, can refresh more often)
    refetchInterval: 60 * 1000, // 1 minute background refresh
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
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
    decimals: 18, // Default decimals (can be fetched separately if needed)
    retryAttempt: 0, // TODO: Track retry attempts if needed
    refreshBets: refetch,
    source: data?.source || 'unknown',
    count: data?.count || 0
  }
}