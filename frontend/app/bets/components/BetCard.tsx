// frontend/app/bets/components/BetCard.tsx
'use client'

import Link from 'next/link'
// import { formatUnits } from 'viem'
import { BetDetails } from '../types/bet.types'

interface BetCardProps {
  bet: BetDetails
  decimals: number
}

export default function BetCard({ bet }: BetCardProps) { //removed BetCard({ bet, decimals }
  // ✅ Only use random ID - no fallback to numeric ID
  if (!bet.randomId) {
    // This shouldn't happen if useBetsList is filtering correctly
    console.warn(`Bet ${bet.id} has no random ID mapping`)
    return null
  }
  
  const betUrl = `/bets/${bet.randomId}`
  
  // const totalPool = bet.totalAmounts.reduce((sum, amount) => sum + amount, BigInt(0))
  // const userBetFormatted = formatUnits(bet.userTotalBet, decimals)
  // const totalPoolFormatted = formatUnits(totalPool, decimals)

  const isActive = Date.now() < Number(bet.endTime) * 1000
  //const status = bet.resolved ? 'Resolved' : (isActive ? 'Active' : 'Pending Resolution')

  const statusColor = bet.resolved ? 'bg-green-500' : (isActive ? 'bg-blue-500' : 'bg-yellow-600')
  
  const timeLeft = isActive ? Number(bet.endTime) * 1000 - Date.now() : 0
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

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
          {/* <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
            {status}
          </span> */}
          <span className="text-sm text-green-400 font-medium">
            {getRoleDisplay()}
          </span>
        </div>

        {/* Bet Name */}
        <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
          {bet.name}
        </h3>

        {/* Options Preview */}
        {/* <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Options:</div>
          <div className="space-y-1">
            {bet.options.slice(0, 2).map((option, index) => (
              <div key={index} className="text-sm text-gray-300 truncate">
                • {option}
              </div>
            ))}
            {bet.options.length > 2 && (
              <div className="text-sm text-gray-400">
                +{bet.options.length - 2} more options
              </div>
            )}
          </div>
        </div> */}

        {/* Stats on status & time left */}
        <div className="space-y-2 text-sm">
          {/* <div className="flex justify-between">
            <span className="text-gray-400">Your Bet:</span>
            <span className="text-green-400 font-medium">{userBetFormatted} HYPE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Pool:</span>
            <span className="text-white font-medium">{totalPoolFormatted} HYPE</span>
          </div> */}

          {isActive && ( // if active, show  time left
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status} • {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
              </span>
            </div>
          )}
          {!isActive && ( // if not active (complete/pending resolution, don't show time)
            <div className="mt-2 flex justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                {status}
              </span>
            </div>
          )}
          {/* {isActive && (
            <div className="mt-2 flex justify-between">
              <span className="text-gray-400">Time Left:</span>
              <span className="text-blue-400 font-medium">
                {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
              </span>
            </div>
          )} */}
        </div>

        {/* Call To Action */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-sm text-gray-400 flex items-center justify-between">
            {/* {bet.options.length} options • Created by {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)} */}
            <span>Created by {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)}</span>
            <span className="text-green-400 group-hover:translate-x-1 transition-transform">Join Bet →</span>
          </div>
        </div>

      </div>
    </Link>
  )
}