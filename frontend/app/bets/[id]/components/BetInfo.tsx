// components/bet/BetInfo.tsx
import { formatUnits } from 'viem'

interface BetInfoProps {
  name: string
  creator: string
  timeLeft: number
  isActive: boolean
  resolved: boolean
  winningOption?: number
  options?: readonly string[]
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
  totalAmounts?: readonly bigint[]
  decimals?: number
}

export function BetInfo({
  name,
  creator,
  timeLeft,
  isActive,
  resolved,
  winningOption,
  options,
  resolutionTimeLeft,
  resolutionDeadlinePassed,
  totalAmounts,
  decimals
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
        description: options && winningOption !== undefined ? `"${options[winningOption]}" won` : 'Completed'
      }
    }
    
    if (resolutionDeadlinePassed) {
      return {
        text: 'Deadline Passed',
        color: 'bg-red-600',
        description: 'Resolution deadline expired'
      }
    }
    
    if (!isActive) {
      return {
        text: 'Pending Resolution',
        color: 'bg-yellow-600',
        description: `Creator has ${formatTimeRemaining(resolutionTimeLeft)} to resolve`
      }
    }
    
    return {
      text: 'Active',
      color: 'bg-blue-600',
      description: `${formatTimeRemaining(timeLeft)} remaining`
    }
  }

  const status = getStatusDisplay()

  return (
    <div className="mb-8">
      {/* Main bet title and status */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-3">{name}</h1>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-gray-400">
              Created by {creator?.slice(0, 6)}...{creator?.slice(-4)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`inline-block ${status.color} text-white px-4 py-2 rounded-full text-sm font-medium`}>
            {status.text}
          </span>
          <p className="text-gray-400 text-sm mt-2">
            {status.description}
          </p>
        </div>
      </div>

      {/* Betting Options Display - Card Style */}
      <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm">
            📊
          </span>
          Betting Options
        </h3>
        
        <div className="grid gap-4">
          {options?.map((option, index) => {
            const poolAmount = totalAmounts && decimals ? formatUnits(totalAmounts[index], decimals) : '0'
            const isWinner = resolved && winningOption === index
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border transition-all ${
                  isWinner 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isWinner 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">{option}</p>
                      <p className="text-gray-400 text-sm">
                        Pool: {poolAmount} HYPE
                      </p>
                    </div>
                  </div>
                  
                  {isWinner && (
                    <div className="flex items-center gap-2">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        👑 WINNER
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Total Pool Summary */}
        {totalAmounts && decimals && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total Pool:</span>
              <span className="text-white font-bold text-lg">
                {formatUnits(
                  totalAmounts.reduce((sum, amount) => sum + amount, BigInt(0)), 
                  decimals
                )} HYPE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status alerts */}
      {resolved && winningOption !== undefined && options && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">🎉</span>
            <span className="text-green-300 font-semibold">
              Bet resolved! &quot;{options[winningOption]}&quot; was the winning outcome.
            </span>
          </div>
        </div>
      )}

      {resolutionDeadlinePassed && !resolved && (
        <div className="mt-4 p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">⏰</span>
            <span className="text-orange-300 font-semibold">
              Resolution deadline has passed. Participants can claim refunds.
            </span>
          </div>
        </div>
      )}

      {!resolved && !resolutionDeadlinePassed && !isActive && (
        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">⏳</span>
            <span className="text-yellow-300 font-semibold">
              Betting has ended. Waiting for the creator to resolve the outcome.
            </span>
          </div>
          <p className="text-yellow-200 text-sm mt-1">
            Time remaining for resolution: {formatTimeRemaining(resolutionTimeLeft)}
          </p>
        </div>
      )}
    </div>
  )
}