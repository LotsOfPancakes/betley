// frontend/app/bets/components/BetCard.tsx
'use client'

import Link from 'next/link'
import { formatUnits } from 'viem'
import { BetDetails } from '../types/bet.types'
import { isBetEmpty, formatDynamicDecimals } from '@/lib/utils/bettingUtils'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'
import { BET_CONSTANTS } from '@/lib/constants/bets'

interface BetCardProps {
  bet: BetDetails
  decimals: number
}

export default function BetCard({ bet, decimals }: BetCardProps) {
  // ✅ Only use random ID - no fallback to numeric ID
  if (!bet.randomId) {
    // This shouldn't happen if useBetsList is filtering correctly
    console.warn(`Bet ${bet.id} has no random ID mapping`)
    return null
  }
  
  const betUrl = `/bets/${bet.randomId}`
  const isActive = Date.now() < Number(bet.endTime) * 1000
  const isNativeBet = !bet.token || bet.token === '0x0000000000000000000000000000000000000000'
  const tokenSymbol = getTokenSymbol(isNativeBet)
  
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

  // Calculate pool statistics
  const totalPool = bet.totalAmounts.reduce((sum, amount) => sum + amount, BigInt(0))
  const formatAmount = (amount: bigint) => formatDynamicDecimals(formatUnits(amount, decimals))
  
  // Generate option breakdown text
  const getOptionsBreakdown = () => {
    if (bet.totalAmounts.length === 0 || totalPool === BigInt(0)) {
      return `${bet.options.length} options • No bets yet`
    }

    const optionStats = bet.options.map((option, index) => {
      const amount = bet.totalAmounts[index] || BigInt(0)
      const percentage = totalPool > BigInt(0) ? Number((amount * BigInt(100)) / totalPool) : 0
      return {
        name: option,
        amount,
        percentage
      }
    })

    // Sort by amount to show largest first
    optionStats.sort((a, b) => Number(b.amount - a.amount))

    // Format as "Yes: 45.2 ETH (67%) • No: 22.1 ETH (33%)"
    return optionStats
      .map(stat => `${stat.name}: ${formatAmount(stat.amount)} ${tokenSymbol} (${stat.percentage}%)`)
      .join(' • ')
  }

  // Get user's position if they have bets
  const getUserPosition = () => {
    if (bet.userTotalBet === BigInt(0)) return null
    
    const userBetFormatted = formatAmount(bet.userTotalBet)
    
    // Find which option(s) user bet on (this would need to be added to BetDetails type)
    // For now, just show total bet amount
    return `Your position: ${userBetFormatted} ${tokenSymbol}`
  }

  return (
    <Link href={betUrl} className="block group">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">

        {/* Header: Bet Title + Status + Timer */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-white leading-tight flex-1 min-w-0 group-hover:text-green-400 transition-colors">
            <span className="line-clamp-2">{bet.name}</span>
          </h3>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor} whitespace-nowrap`}>
              {status}
            </span>
            
            {/* Timer */}
            {(isActive || (!bet.resolved && !resolutionDeadlinePassed)) && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {isActive 
                  ? (hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`)
                  : (resolutionHoursLeft > 0 ? `${resolutionHoursLeft}h ${resolutionMinutesLeft}m` : `${resolutionMinutesLeft}m`)
                }
              </span>
            )}
          </div>
        </div>

        {/* Options Breakdown */}
        <div className="text-sm text-gray-300 mb-3">
          {getOptionsBreakdown()}
        </div>

        {/* Total Pool */}
        <div className="text-sm font-medium text-emerald-300 mb-3">
          Total: {formatAmount(totalPool)} {tokenSymbol}
        </div>

        {/* User Position (if any) */}
        {getUserPosition() && (
          <div className="text-sm text-green-400 mb-4">
            {getUserPosition()}
          </div>
        )}

        {/* Footer: Role + Creator */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400 font-medium">
              {getRoleDisplay()}
            </span>
            <span className="text-xs text-gray-500">
              by {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)}
            </span>
          </div>
          <span className="text-xs text-green-400 group-hover:translate-x-1 transition-transform">
            View →
          </span>
        </div>

      </div>
    </Link>
  )
}