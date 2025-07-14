// frontend/app/bets/[id]/components/BetInfo.tsx
'use client'

import { formatUnits } from 'viem'

interface BetInfoProps {
  name: string
  creator: string
  options: readonly string[]
  totalAmounts?: readonly bigint[]
  decimals?: number
  isActive: boolean
  resolved: boolean
  winningOption?: number
  userBets?: readonly bigint[]
  timeLeft: number
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
}

export function BetInfo({
  name,
  options,
  totalAmounts,
  decimals,
  isActive,
  resolved,
  winningOption,
  timeLeft,
  resolutionTimeLeft,
  resolutionDeadlinePassed
}: BetInfoProps) {
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getStatusDisplay = () => {
    if (resolved) {
      return {
        text: 'Resolved',
        color: 'bg-green-600',
        description: options && winningOption !== undefined ? 
          `Winner: ${options[winningOption]}` : 'Bet has been resolved',
        timeInfo: null
      }
    }
    
    if (resolutionDeadlinePassed) {
      return {
        text: 'Refund Available',
        color: 'bg-orange-600', 
        description: 'Creator failed to resolve - claim your refund',
        timeInfo: null
      }
    }
    
    if (!isActive) {
      return {
        text: 'Pending Resolution',
        color: 'bg-yellow-600',
        description: resolutionTimeLeft > 0 ? 
          `Creator has ${formatTimeRemaining(resolutionTimeLeft)} to resolve` :
          'Waiting for creator to resolve',
        timeInfo: null
      }
    }
    
    return {
      text: 'Active',
      color: 'bg-blue-600',
      description: 'Betting is currently open',
      timeInfo: formatTimeRemaining(timeLeft)
    }
  }

  const status = getStatusDisplay()
  
  // Calculate total pool
  const totalPool = totalAmounts && decimals !== undefined ? 
    totalAmounts.reduce((a, b) => a + b, BigInt(0)) : BigInt(0)

  return (
    <div className="space-y-6">
      {/* Bet Title and Status */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{name}</h1>
        </div>
        <div className="flex flex-col items-end space-y-3">
          {/* Status badge with time info */}
          <div className="flex flex-col items-end">
            <div className={`${status.color} text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2`}>
              <span>{status.text}</span>
              {status.timeInfo && (
                <>
                  <span className="text-blue-100">•</span>
                  <span className="text-blue-100 font-medium">{status.timeInfo}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Total pool */}
          {totalAmounts && decimals !== undefined && totalPool > BigInt(0) && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Pool</p>
              <p className="text-xl font-bold text-white">{formatUnits(totalPool, decimals)} HYPE</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Description - Only show if no timeInfo or for non-active states */}
      {(!status.timeInfo || !isActive) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-300">{status.description}</p>
        </div>
      )}

      {/* Pool Breakdown - Only show if there are bets and we have the data */}
      {totalAmounts && decimals !== undefined && options && totalPool > BigInt(0) && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">📊 Current Pools</h3>
          <div className="grid gap-3">
            {options.map((option, index) => {
              const amount = totalAmounts[index] || BigInt(0)
              const percentage = totalPool > BigInt(0) ? 
                Number((amount * BigInt(100)) / totalPool) : 0
              
              return (
                <div key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{option}</span>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {formatUnits(amount, decimals)} HYPE
                      </p>
                      <p className="text-sm text-gray-400">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}