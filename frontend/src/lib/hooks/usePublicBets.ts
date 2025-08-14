// frontend/lib/hooks/usePublicBets.ts
import { useQuery } from '@tanstack/react-query'
import type { PublicBet } from '@/app/bets/types/bet.types'

interface PublicBetsResponse {
  bets: PublicBet[]
  count: number
  hasMore?: boolean
  source?: string // Indicates data source (database vs blockchain)
}

interface UsePublicBetsOptions {
  limit?: number
  offset?: number
  enabled?: boolean
}

export function usePublicBets(options: UsePublicBetsOptions = {}) {
  const { limit = 50, offset = 0, enabled = true } = options

  return useQuery({
    queryKey: ['public-bets', limit, offset],
    queryFn: async (): Promise<PublicBetsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      const response = await fetch(`/api/bets/public?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch public bets: ${response.status}`)
      }
      
      return response.json()
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute (can be longer since no blockchain dependency)
    refetchInterval: 120 * 1000, // 2 minutes (faster refresh for new public bets)
    retry: 2
  })
}