// frontend/lib/hooks/usePublicBets.ts
import { useQuery } from '@tanstack/react-query'

interface PublicBet {
  randomId: string
  // ✅ SECURITY: numericId removed to prevent contract enumeration
  name: string
  creator: string
  createdAt: string
  isPublic: boolean
  endTime: string // Database end time as string (converted to milliseconds)
  timeRemaining: string // Formatted time remaining from database
  resolved?: boolean // NEW: Resolution status from database
  winningOption?: number | null // NEW: Winning option from database
  totalAmounts?: number[] // NEW: Bet amounts from database
}

interface PublicBetsResponse {
  bets: PublicBet[]
  count: number
  hasMore: boolean
  source?: string // NEW: Indicates data source (database vs blockchain)
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