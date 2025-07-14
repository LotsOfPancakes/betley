// frontend/app/bets/[id]/components/UnifiedBettingInterface.tsx
'use client'

import { formatUnits } from 'viem'
import { useEffect } from 'react'

interface UnifiedBettingInterfaceProps {
  // Bet Info props
  name: string
  isActive: boolean
  resolved: boolean
  winningOption?: number
  timeLeft: number
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
  
  // Betting Interface props
  address?: string
  options?: readonly string[]
  userBets?: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  betAmount: string
  setBetAmount: (amount: string) => void
  needsApproval: boolean
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  totalAmounts?: readonly bigint[]
  decimals?: number
  hypeBalance?: bigint
  justPlacedBet?: boolean
  hasExistingBet?: boolean
  isNativeBet?: boolean
}

export function UnifiedBettingInterface({
  // Bet info
  name,
  isActive,
  resolved,
  winningOption,
  timeLeft,
  resolutionTimeLeft,
  resolutionDeadlinePassed,
  
  // Betting interface
  address,
  options,
  userBets,
  selectedOption,
  setSelectedOption,
  betAmount,
  setBetAmount,
  needsApproval,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  totalAmounts,
  decimals,
  hypeBalance,
  justPlacedBet,
  hasExistingBet,
  isNativeBet = false
}: UnifiedBettingInterfaceProps) {

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
        text: 'Expired',
        color: 'bg-gray-600',
        description: resolutionTimeLeft > 0 ? 
          `Creator has ${formatTimeRemaining(resolutionTimeLeft)} to resolve` :
          'Betting period has ended',
        timeInfo: null
      }
    }
    
    return {
      text: 'Active',
      color: 'bg-blue-600',
      description: 'Betting is currently open',
      timeInfo: timeLeft > 0 ? formatTimeRemaining(timeLeft) : null
    }
  }

  const status = getStatusDisplay()
  
  // Calculate total pool
  const totalPool = totalAmounts && decimals !== undefined ? 
    totalAmounts.reduce((a, b) => a + b, BigInt(0)) : BigInt(0)

  // Find which option user has already bet on
  const userExistingOptionIndex = hasExistingBet && userBets 
    ? userBets.findIndex(amount => amount > BigInt(0))
    : -1

  // Auto-select the option user has already bet on
  const effectiveSelectedOption = hasExistingBet && userExistingOptionIndex !== -1 
    ? userExistingOptionIndex 
    : selectedOption

  // Ensure the parent selectedOption state is synced with our effective selection
  useEffect(() => {
    if (hasExistingBet && userExistingOptionIndex !== -1 && selectedOption !== userExistingOptionIndex) {
      setSelectedOption(userExistingOptionIndex)
    }
  }, [hasExistingBet, userExistingOptionIndex, selectedOption, setSelectedOption])

  const canBet = isActive && address

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Header Section with Title, Status, and Total Pool */}
      <div className="flex justify-between items-start mb-6">
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
              <p className="text-xl font-bold text-white">
                {formatUnits(totalPool, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Description - Only show if relevant */}
      {(!status.timeInfo || !isActive) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-gray-300">{status.description}</p>
        </div>
      )}

      {/* Show existing bet info if user has bet */}
      {hasExistingBet && userBets && options && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
          {userBets.map((amount, index) => {
            if (amount === BigInt(0)) return null
            return (
              <div key={index}>
                <h4 className="font-semibold text-blue-300">
                  Your Current Bet: {formatUnits(amount, decimals || 18)} {isNativeBet ? 'HYPE' : 'mHYPE'} on <span className="text-gray-300">{options[index]}</span>
                </h4>
              </div>
            )
          })}
        </div>
      )}

      {/* Bet Options Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {hasExistingBet ? 'Bet More - Single Option' : 'Bet Options'}
          </h3>
          
          {/* Show wallet connection prompt if not connected */}
          {!address && (
            <div className="bg-gray-700/50 rounded-lg p-4 text-center mb-4">
              <p className="text-gray-400">Connect your wallet to place bets</p>
            </div>
          )}

          {/* Show betting ended message if not active */}
          {!canBet && address && (
            <div className="bg-gray-700/50 rounded-lg p-4 text-center mb-4">
              <p className="text-gray-400">Betting period has ended</p>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid gap-3">
            {options?.map((option, index) => {
              const totalForOption = totalAmounts?.[index] || BigInt(0)
              const totalFormatted = formatUnits(totalForOption, decimals || 18)
              const percentage = totalPool > BigInt(0) ? 
                Number((totalForOption * BigInt(10000)) / totalPool) / 100 : 0
              
              const isUserCurrentOption = hasExistingBet && index === userExistingOptionIndex
              const isDisabled = !canBet || (hasExistingBet && !isUserCurrentOption)
              const isSelected = effectiveSelectedOption === index
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && setSelectedOption(index)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                      : isDisabled
                      ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                      : 'border-gray-600 bg-gray-900 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option}</span>
                      {isUserCurrentOption && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          Current Bet
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-300">
                        {parseFloat(totalFormatted).toFixed(3)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Betting Form - Only show if can bet */}
        {canBet && (
          <>
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {hasExistingBet ? 'Additional bet:' : 'Bet amount:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.0"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg pr-20 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400 font-medium">
                    {isNativeBet ? 'HYPE' : 'mHYPE'}
                  </span>
                </div>
              </div>
              
              {/* Balance display */}
              {hypeBalance !== undefined && (
                <div className="text-sm text-gray-400 mt-2">
                  Balance: {formatUnits(hypeBalance, decimals || 18)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isPending || !betAmount || parseFloat(betAmount) <= 0}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isApproving ? 'Approving...' : `Approve ${isNativeBet ? 'HYPE' : 'mHYPE'}`}
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('🔍 Button clicked with:', {
                      betAmount,
                      effectiveSelectedOption,
                      selectedOption,
                      hasExistingBet,
                      userExistingOptionIndex,
                      isPending,
                      canBet
                    })
                    handlePlaceBet()
                  }}
                  disabled={
                    isPending || 
                    !betAmount || 
                    parseFloat(betAmount) <= 0 || 
                    effectiveSelectedOption === null
                  }
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending 
                    ? 'Placing Bet...' 
                    : hasExistingBet 
                    ? `Add ${betAmount || '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'} to Bet`
                    : `Place Bet: ${betAmount || '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'}`
                  }
                </button>
              )}
            </div>

            {/* Just placed bet message */}
            {justPlacedBet && (
              <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <p className="text-green-300 text-sm text-center">
                  ✅ {hasExistingBet ? 'Additional bet placed successfully!' : 'Bet placed successfully!'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}