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
  options: readonly string[]
  userBets: readonly bigint[]
  totalAmounts: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  hasExistingBet: boolean
  resolved: boolean
  winningOption?: number
  decimals: number
  isNativeBet: boolean
}

export function BetOptionsGrid({
  options,
  userBets,
  totalAmounts,
  selectedOption,
  setSelectedOption,
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



  return (
    <div className="space-y-6">
      <div>
        
        {/* Options Grid */}
        <div className="grid gap-4">
          {options.map((option, index) => {
            const totalForOption = totalAmounts[index] || BigInt(0)
            const percentage = calculateOptionPercentage(totalForOption, totalPool)
            
            const isUserCurrentOption = hasExistingBet && index === userExistingOptionIndex
            
            // Allow selection for disconnected users, but respect other disable conditions
            const canClick = !resolved && (!hasExistingBet || isUserCurrentOption)
            const isSelected = effectiveSelectedOption === index
            const isWinningOption = resolved && winningOption === index
            const isUserWinningBet = isUserCurrentOption && isWinningOption
            const isUserLosingBet = isUserCurrentOption && !isWinningOption && resolved
            
            // Determine styling based on state priority
            let buttonStyle = ''
            if (isWinningOption) {
              // Winner: Always green and prominent
              buttonStyle = 'border-green-500/60 bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-green-300 shadow-lg shadow-green-500/20'
            } else if (isUserLosingBet) {
              // User's losing bet: put as gray, same as not-clickable - the blue pill indicating their bet is enough
              buttonStyle = 'border-gray-700/30 bg-gray-800/20 text-gray-500 cursor-not-allowed opacity-50'
              // buttonStyle = 'border-blue-500/50 bg-gradient-to-br from-blue-900/35 to-purple-900/35 text-blue-300 shadow-sm shadow-blue-500/15'
            } else if (isSelected && !resolved) {
              // Currently selected for betting: Green
              buttonStyle = 'border-green-500/50 border-1 bg-gradient-to-br from-green-900/30 to-emerald-900/30 text-green-300 shadow-sm shadow-green-500/10 hover:scale-102'
            } else if (isUserCurrentOption && !resolved) {
              // User's current bet (active): Lighter green
              buttonStyle = 'border-green-500/40 border-1 bg-gradient-to-br from-green-900/25 to-emerald-900/25 text-green-300'
            } else if (!canClick) {
              // Not clickable (resolved or existing bet conflict): Gray with no-click cursor
              buttonStyle = 'border-gray-700/30 bg-gray-800/20 text-gray-500 cursor-not-allowed opacity-50'
            } else {
              // Default clickable: Gray with hover and pointer cursor
              buttonStyle = 'border-gray-600/30 bg-gray-800/20 text-gray-300 hover:border-gray-500/50 hover:bg-gray-700/30 hover:scale-102 cursor-pointer'
            }
            
            return (
              <button
                key={index}
                onClick={() => canClick && setSelectedOption(index)}
                disabled={!canClick}
                className={`p-4 rounded-2xl text-left transition-all duration-300 ${buttonStyle}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{option}</span>
                    
                    {isUserWinningBet && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1.5 rounded-full font-bold shadow-lg">
                          Winner
                        </span>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1.5 rounded-full font-medium border border-green-500/30">
                          You Bet: {formatDynamicDecimals(formatUnits(userBets[index] || BigInt(0), decimals))} {tokenSymbol}
                        </span>
                      </div>
                    )}
                    
                    {isWinningOption && !isUserCurrentOption && (
                      <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                        Winner
                      </span>
                    )}
                    
                    {isUserLosingBet && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1.5 rounded-full font-medium border border-blue-500/30">
                          You Bet: {formatDynamicDecimals(formatUnits(userBets[index] || BigInt(0), decimals))} {tokenSymbol}
                        </span>
                      </div>
                    )}
                    
                    {isUserCurrentOption && !resolved && (
                      <span className="text-xs bg-green-500/80 text-white px-2 py-1.5 rounded-full font-medium">
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