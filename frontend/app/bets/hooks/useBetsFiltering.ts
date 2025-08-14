// frontend/app/bets/hooks/useBetsFiltering.ts
import { useState, useMemo } from 'react'
import { FilterType, PrivateBet } from '../types/bet.types'
import { BET_CONSTANTS } from '@/lib/constants/bets'

export function useBetsFiltering(bets: PrivateBet[]) {
  const [filter, setFilter] = useState<FilterType>('active')

  // Filter bets based on selected filter
  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const now = Math.floor(Date.now() / 1000)
      const hasEnded = bet.endTime <= now
      const resolutionDeadlinePassed = now > (bet.endTime + (BET_CONSTANTS.timeouts.resolutionDeadline / 1000))
      const isEmpty = bet.totalAmounts.reduce((sum, amount) => sum + amount, 0) === 0
      const isRefundAvailable = hasEnded && !bet.resolved && resolutionDeadlinePassed && !isEmpty
      const isExpired = hasEnded && !bet.resolved && resolutionDeadlinePassed && isEmpty

      switch (filter) {
        case 'active':
          return !hasEnded && !bet.resolved
        case 'pending':
          return hasEnded && !bet.resolved && !resolutionDeadlinePassed // Exclude refunds and expired
        case 'resolved':
          return bet.resolved || isRefundAvailable // Actually resolved bets + refundable bets
        case 'expired':
          return isExpired // Empty bets past deadline
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