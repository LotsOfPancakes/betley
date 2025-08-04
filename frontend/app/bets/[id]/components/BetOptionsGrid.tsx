// frontend/app/bets/[id]/components/BetOptionsGrid.tsx
'use client'

import { formatUnits } from 'viem'
// AppKit buttons are web components - no import needed
import { 
  formatDynamicDecimals, 
  calculateOptionPercentage, 
  getUserExistingOptionIndex
} from '@/lib/utils/bettingUtils'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'

interface BetOptionsGridProps {
  address?: string
  options: readonly string[]
  userBets: readonly bigint[]
  totalAmounts: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  canBet: boolean
  hasExistingBet: boolean
  resolved: boolean
  winningOption?: number
  decimals: number
  isNativeBet: boolean
}

export function BetOptionsGrid({
  address,
  options,
  userBets,
  totalAmounts,
  selectedOption,
  setSelectedOption,
  canBet,
  hasExistingBet,
  resolved,
  winningOption,
  decimals,
  isNativeBet
}: BetOptionsGridProps) {

  // Calculate totals using utility functions
  const totalPool = totalAmounts.reduce((a, b) => a + b, BigInt(0))
  const userExistingOptionIndex = getUserExistingOptionIndex(userBets)
  const effectiveSelectedOption = hasExistingBet ? userExistingOptionIndex : selectedOption

  // Get token symbol
  const tokenSymbol = getTokenSymbol(isNativeBet)

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="flex justify-center mb-6 p-6 bg-gray-800/40 rounded-2xl">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Connect your wallet to start Betting</p>
          <appkit-button />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        
        {/* Options Grid */}
        <div className="grid gap-4">
          {options.map((option, index) => {
            const totalForOption = totalAmounts[index] || BigInt(0)
            const percentage = calculateOptionPercentage(totalForOption, totalPool)
            
            const isUserCurrentOption = hasExistingBet && index === userExistingOptionIndex
            const isDisabled = !canBet || (hasExistingBet && !isUserCurrentOption)
            const isSelected = effectiveSelectedOption === index
            const isWinningOption = resolved && winningOption === index
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && setSelectedOption(index)}
                disabled={isDisabled}
                className={`p-4 rounded-2xl text-left transition-all duration-300 ${
                  isWinningOption
                    ? 'border-green-500/60 bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-green-300 shadow-xl shadow-green-500/20'
                    : isSelected
                    ? 'border-green-500/50 bg-gradient-to-br from-green-900/30 to-emerald-900/30 text-green-300 shadow-lg shadow-green-500/10 hover:scale-105'
                    : isUserCurrentOption
                    ? 'border-green-500/40 bg-gradient-to-br from-green-900/25 to-emerald-900/25 text-green-300'
                    : isDisabled
                    ? 'border-gray-700/30 bg-gray-800/20 text-gray-500 cursor-not-allowed opacity-50'
                    : 'border-gray-600/30 bg-gray-800/20 text-gray-300 hover:border-gray-500/50 hover:bg-gray-700/30 hover:scale-105'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{option}</span>
                    
                    {isWinningOption && (
                      <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium">
                        Winner
                      </span>
                    )}
                    
                    {isUserCurrentOption && !isWinningOption && (
                      <span className="text-xs bg-green-500/80 text-white px-3 py-1 rounded-full font-medium">
                        You Bet: {formatDynamicDecimals(formatUnits(userBets[index] || BigInt(0), decimals))} {tokenSymbol}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-300">
                      {formatDynamicDecimals(formatUnits(totalForOption, decimals))} {tokenSymbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}