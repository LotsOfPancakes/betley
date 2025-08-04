// frontend/lib/hooks/usePublicBets.ts
import { useQuery } from '@tanstack/react-query'

interface PublicBet {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: string
  isPublic: boolean
  endTime: string // NEW: Contract end time as string (converted from bigint)
  timeRemaining: string // NEW: Formatted time remaining
}

interface PublicBetsResponse {
  bets: PublicBet[]
  count: number
  hasMore: boolean
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
    staleTime: 30 * 1000, // 30 seconds (reduced due to time-sensitive active bets)
    refetchInterval: 60 * 1000, // 1 minute (more frequent updates for active bets)
    retry: 2
  })
}