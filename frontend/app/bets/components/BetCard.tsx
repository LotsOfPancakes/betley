// frontend/app/bets/components/BetCard.tsx
'use client'

import Link from 'next/link'
import { formatUnits } from 'viem'
import { UnifiedBet } from '../types/bet.types'
import { formatDynamicDecimals } from '@/lib/utils/bettingUtils'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'
import { BET_CONSTANTS } from '@/lib/constants/bets'
import { ZERO_ADDRESS } from '@/lib/tokenUtils'

interface BetCardProps {
  bet: UnifiedBet // ✅ Now accepts both public and private bets
  decimals: number
  variant?: 'auto' | 'public' | 'private' // ✅ Optional explicit variant
}

export default function BetCard({ bet, decimals, variant = 'auto' }: BetCardProps) {
  // ✅ Auto-detect variant based on data structure
  const isPublicBet = variant === 'public' || 
                     (variant === 'auto' && bet.userRole === null)
  // Auto-detect if this is a public bet (userRole is null for public bets)

  // ✅ Unified bet should always have randomId
  if (!bet.randomId) {
    return null
  }
  
  const betUrl = `/bets/${bet.randomId}`
  const isActive = Date.now() < (bet.endTime * 1000) // ✅ endTime is now Unix timestamp (number)
  const isNativeBet = !('token' in bet) || !bet.token || bet.token === ZERO_ADDRESS
  const tokenSymbol = getTokenSymbol(isNativeBet)
  
  const now = Date.now()
  const hasEnded = now >= (bet.endTime * 1000)
  const resolutionDeadlinePassed = hasEnded && now > (bet.endTime * 1000 + BET_CONSTANTS.timeouts.resolutionDeadline)
  // ✅ Handle unified format for isBetEmpty check
  const isEmpty = bet.totalAmounts.reduce((sum, amount) => sum + amount, 0) === 0
  
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
  
  const timeLeft = isActive ? bet.endTime * 1000 - Date.now() : 0
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  
  // Calculate resolution time left for pending bets
  const resolutionTimeLeft = hasEnded && !resolutionDeadlinePassed ? 
    (bet.endTime * 1000 + BET_CONSTANTS.timeouts.resolutionDeadline) - now : 0
  const resolutionHoursLeft = Math.floor(resolutionTimeLeft / (1000 * 60 * 60))
  const resolutionMinutesLeft = Math.floor((resolutionTimeLeft % (1000 * 60 * 60)) / (1000 * 60))

  const getRoleDisplay = () => {
    // ✅ Handle unified bet types (null userRole for public bets)
    if (isPublicBet) return '🌍 Public' // Show public indicator for public bets
    
    switch (bet.userRole) {
      case 'creator': return 'Creator'
      case 'bettor': return 'Bettor'  
      case 'both': return 'Creator & Bettor'
      default: return ''
    }
  }

  // ✅ Calculate pool statistics - handle unified format (number[] vs bigint[])
  const totalPool = bet.totalAmounts.reduce((sum, amount) => sum + amount, 0)
  const formatAmount = (amount: number) => formatDynamicDecimals(formatUnits(BigInt(amount), decimals))
  
  // ✅ Generate option breakdown data - unified format
  const getOptionsBreakdown = () => {
    if (bet.totalAmounts.length === 0 || totalPool === 0) {
      return []
    }

    const optionStats = bet.options.map((option, index) => {
      const amount = bet.totalAmounts[index] || 0
      const amountInEth = parseFloat(formatUnits(BigInt(amount), decimals))
      const totalPoolInEth = parseFloat(formatUnits(BigInt(totalPool), decimals))
      const percentage = totalPoolInEth > 0 ? Math.round((amountInEth * 100) / totalPoolInEth) : 0
      return {
        name: option,
        amount,
        percentage
      }
    })

    // Sort by amount to show largest first
    optionStats.sort((a, b) => b.amount - a.amount)

    return optionStats
  }

  // ✅ Get user's position if they have bets - unified format
  const getUserPosition = () => {
    if (isPublicBet || bet.userTotalBet === 0) return null
    
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
        <div className="text-sm text-gray-300 mb-3 space-y-1">
          {getOptionsBreakdown().length > 0 ? (
            getOptionsBreakdown().map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{stat.name}:</span>
                <span>{formatAmount(stat.amount)} {tokenSymbol} ({stat.percentage}%)</span>
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic">No bets yet</div>
          )}
        </div>

        {/* Total Pool */}
        {/* <div className="text-sm font-medium text-emerald-300 mb-3">
          Total: {formatAmount(totalPool)} {tokenSymbol}
        </div> */}

        {/* User Position (if any) */}
        {getUserPosition() && (
          <div className="text-sm text-green-400 mb-4">
            {getUserPosition()}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-700/50">
          {/* Row 1: Role + View */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-green-400 font-medium">
              {getRoleDisplay()}
            </span>
            <span className="text-xs text-green-400 group-hover:translate-x-1 transition-transform">
              View →
            </span>
          </div>
          
          {/* Row 2: Creator */}
          <div className="text-xs text-gray-500">
            by {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)}
          </div>
        </div>

      </div>
    </Link>
  )
}