// frontend/app/bets/hooks/useBetsFiltering.ts
import { useState, useMemo } from 'react'
import { BetDetails, FilterType } from '../types/bet.types'

export function useBetsFiltering(bets: BetDetails[]) {
  const [filter, setFilter] = useState<FilterType>('all')

  // Filter bets based on selected filter
  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const now = Math.floor(Date.now() / 1000)
      const hasEnded = Number(bet.endTime) <= now

      switch (filter) {
        case 'active':
          return !hasEnded && !bet.resolved
        case 'pending':
          return hasEnded && !bet.resolved
        case 'resolved':
          return bet.resolved
        default:
          return true
      }
    })
  }, [bets, filter])

  return {
    filter,
    setFilter,
    filteredBets
  }
}