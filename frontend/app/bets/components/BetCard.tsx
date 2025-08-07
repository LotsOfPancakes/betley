// frontend/app/bets/components/BetCard.tsx
'use client'

import Link from 'next/link'
import { BetDetails } from '../types/bet.types'
import { isBetEmpty } from '@/lib/utils/bettingUtils'
import { BET_CONSTANTS } from '@/lib/constants/bets'

interface BetCardProps {
  bet: BetDetails
  decimals: number
}

export default function BetCard({ bet }: BetCardProps) {
  // ✅ Only use random ID - no fallback to numeric ID
  if (!bet.randomId) {
    // This shouldn't happen if useBetsList is filtering correctly
    console.warn(`Bet ${bet.id} has no random ID mapping`)
    return null
  }
  
  const betUrl = `/bets/${bet.randomId}`
  const isActive = Date.now() < Number(bet.endTime) * 1000
  
  const now = Date.now()
  const hasEnded = now >= Number(bet.endTime) * 1000
  const resolutionDeadlinePassed = hasEnded && now > (Number(bet.endTime) * 1000 + BET_CONSTANTS.timeouts.resolutionDeadline)
  const isEmpty = isBetEmpty(bet.totalAmounts)
  
  const getStatus = () => {
    if (bet.resolved) return BET_CONSTANTS.status.labels.resolved
    if (hasEnded && resolutionDeadlinePassed) {
      return isEmpty ? BET_CONSTANTS.status.labels.expired : BET_CONSTANTS.status.labels.refundAvailable
    }
    if (hasEnded) return BET_CONSTANTS.status.labels.pending
    return BET_CONSTANTS.status.labels.active
  }
  
  const status = getStatus()
  const statusColor = bet.resolved ? BET_CONSTANTS.status.colors.resolved : 
                     (hasEnded && resolutionDeadlinePassed && isEmpty) ? BET_CONSTANTS.status.colors.expired :
                     (hasEnded && resolutionDeadlinePassed) ? BET_CONSTANTS.status.colors.refundAvailable :
                     (isActive ? BET_CONSTANTS.status.colors.active : BET_CONSTANTS.status.colors.pending)
  
  const timeLeft = isActive ? Number(bet.endTime) * 1000 - Date.now() : 0
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  
  // Calculate resolution time left for pending bets
  const resolutionTimeLeft = hasEnded && !resolutionDeadlinePassed ? 
    (Number(bet.endTime) * 1000 + BET_CONSTANTS.timeouts.resolutionDeadline) - now : 0
  const resolutionHoursLeft = Math.floor(resolutionTimeLeft / (1000 * 60 * 60))
  const resolutionMinutesLeft = Math.floor((resolutionTimeLeft % (1000 * 60 * 60)) / (1000 * 60))

  const getRoleDisplay = () => {
    switch (bet.userRole) {
      case 'creator': return '👑 Creator'
      case 'bettor': return '🎯 Bettor'  
      case 'both': return '👑 🎯 Creator & Bettor'
      default: return ''
    }
  }

  return (
    <Link href={betUrl} className="block group">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">

        {/* Header showing Role */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm text-green-400 font-medium">
            {getRoleDisplay()}
          </span>
        </div>

        {/* Bet Name */}
        <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
          {bet.name}
        </h3>



        {/* Status and time information */}
        <div className="space-y-2 text-sm">

          {isActive ? (
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status} • {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
              </span>
            </div>
          ) : bet.resolved ? (
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status}
              </span>
            </div>
          ) : resolutionDeadlinePassed ? (
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status}
              </span>
            </div>
          ) : (
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status} • {resolutionHoursLeft > 0 ? `${resolutionHoursLeft}h ${resolutionMinutesLeft}m` : `${resolutionMinutesLeft}m`}
              </span>
            </div>
          )}
        </div>

        {/* Call To Action */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-sm text-gray-400 flex items-center justify-between">
            <span>Created by {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)}</span>
            <span className="text-green-400 group-hover:translate-x-1 transition-transform">Join Bet →</span>
          </div>
        </div>

      </div>
    </Link>
  )
}