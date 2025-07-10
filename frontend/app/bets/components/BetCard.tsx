// frontend/app/bets/components/BetCard.tsx
'use client'

import { formatUnits } from 'viem'
import { useRouter } from 'next/navigation'
import { memo } from 'react'

interface BetDetails {
  id: number
  randomId?: string // Add optional random ID
  name: string
  options: readonly string[]
  creator: string
  endTime: bigint
  resolved: boolean
  winningOption: number
  totalAmounts: readonly bigint[]
  userRole: 'creator' | 'bettor' | 'both'
  userTotalBet: bigint
}

interface BetCardProps {
  bet: BetDetails
  decimals: number
}

function BetCard({ bet, decimals }: BetCardProps) {
  const router = useRouter()
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = Number(bet.endTime) - now
  const hasEnded = timeLeft <= 0

  const getStatus = () => {
    if (bet.resolved) return { text: 'Resolved', color: 'text-green-400' }
    if (hasEnded) return { text: 'Pending Resolution', color: 'text-yellow-400' }
    return { text: 'Active', color: 'text-blue-400' }
  }

  const getRoleBadge = () => {
    switch (bet.userRole) {
      case 'creator':
        return <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Creator</span>
      case 'bettor':
        return <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Bettor</span>
      case 'both':
        return <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Creator & Bettor</span>
    }
  }

  const status = getStatus()
  const totalPool = bet.totalAmounts.reduce((a, b) => a + b, BigInt(0))

  return (
    <div 
      onClick={() => router.push(`/bets/${bet.randomId || bet.id}`)}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{bet.name}</h3>
          {getRoleBadge()}
        </div>
        <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Total Pool:</span>
          <span className="font-semibold text-white">{formatUnits(totalPool, decimals)} HYPE</span>
        </div>
        
        {bet.userTotalBet > BigInt(0) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Your Bet:</span>
            <span className="font-semibold text-blue-400">{formatUnits(bet.userTotalBet, decimals)} HYPE</span>
          </div>
        )}

        <div className="space-y-2">
          {bet.options.map((option, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{option}</span>
              <span className="text-white">{formatUnits(bet.totalAmounts[index], decimals)} HYPE</span>
            </div>
          ))}
        </div>

        {!hasEnded && (
          <div className="text-sm text-gray-400">
            Time left: {Math.floor(timeLeft / 3600)}h {Math.floor((timeLeft % 3600) / 60)}m
          </div>
        )}

        {bet.resolved && (
          <div className="text-sm text-green-400">
            Winner: {bet.options[bet.winningOption]}
          </div>
        )}
      </div>
    </div>
  )
}

// Export with memo for performance
export default memo(BetCard)