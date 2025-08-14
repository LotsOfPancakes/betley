// frontend/app/bets/[id]/components/BetAmountInput.tsx
'use client'

import { useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { formatDynamicDecimals, isValidBetAmount, hasWalletBalance } from '@/lib/utils/bettingUtils'
import { calculatePotentialWinningsPreview } from '@/lib/utils/winningsCalculator'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'

interface BetAmountInputProps {
  betAmount: string
  setBetAmount: (amount: string) => void
  balance: bigint
  decimals: number
  isNativeBet: boolean
  hasExistingBet: boolean
  needsApproval: boolean
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  selectedOption: number | null
  options: readonly string[]
  // New props for potential winnings calculation
  totalAmounts?: readonly bigint[]
  feeParams?: readonly [boolean, bigint, boolean, bigint, string]
}

export function BetAmountInput({
  betAmount,
  setBetAmount,
  balance,
  decimals,
  isNativeBet,
  hasExistingBet,
  needsApproval,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  selectedOption,
  options,
  totalAmounts,
  feeParams
}: BetAmountInputProps) {

  // Get token symbol
  const tokenSymbol = getTokenSymbol(isNativeBet)

  // Validation logic
  const isValidAmount = isValidBetAmount(betAmount)
  const hasBalance = hasWalletBalance(betAmount, balance, decimals)

  // Calculate potential winnings (net profit after deducting bet amount)
  const potentialWinnings = useMemo(() => {
    if (!isValidAmount || selectedOption === null || !totalAmounts || !betAmount) {
      return BigInt(0)
    }

    try {
      const betAmountWei = parseUnits(betAmount, decimals)
      return calculatePotentialWinningsPreview(
        betAmountWei,
        selectedOption,
        totalAmounts,
        feeParams
      )
    } catch {
      return BigInt(0)
    }
  }, [betAmount, selectedOption, totalAmounts, feeParams, decimals, isValidAmount])

  // Format potential winnings for display
  const formattedPotentialWinnings = useMemo(() => {
    if (potentialWinnings === BigInt(0)) return null
    return formatDynamicDecimals(formatUnits(potentialWinnings, decimals))
  }, [potentialWinnings, decimals])

  // Check if we should show the potential winnings preview
  const shouldShowPotentialWinnings = Boolean(
    isValidAmount &&
    selectedOption !== null &&
    formattedPotentialWinnings &&
    options[selectedOption]
  )

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/80 backdrop-blur-sm border border-green-600/20 rounded-3xl p-5 space-y-4">
      {/* Amount Input */}
      <div>
        {/* Input Row */}
        <div className="flex items-center justify-between">
          {/* Left - Label */}
          <span className="text-sm font-medium text-gray-300">
            {hasExistingBet ? 'Additional Bet' : 'Bet Amount'}
          </span>
          
          {/* Right - Input with Sticky Token */}
          <div className="flex-1 max-w-[200px]">
            <div className="flex items-center text-2xl text-white justify-end">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                className="outline-none placeholder-gray-500 text-right flex-1 min-w-0 py-2"
              />
              <span className={`ml-1.5 font-medium ${betAmount ? 'text-white' : 'text-gray-500'}`}>
                {tokenSymbol}
              </span>
            </div>
          </div>
        </div>
        
        {/* Balance Display */}
        {balance && (
          <div className="mt-2 text-xs text-gray-400 text-right">
            Balance: {formatDynamicDecimals(formatUnits(balance, decimals))} {tokenSymbol}
          </div>
        )}

        {/* Separator Line */}
        {shouldShowPotentialWinnings && (
          <div className="mt-3 mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
          </div>
        )}

        {/* Potential Winnings Preview */}
        {shouldShowPotentialWinnings && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-400">Potential win:</span>
            <span className="text-green-400 font-medium text-lg">
              {formattedPotentialWinnings} {tokenSymbol}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div>
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={!isValidAmount || !hasBalance || isApproving}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-center transition-all duration-300 ${
              !isValidAmount || !hasBalance || isApproving
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:scale-105'
            }`}
          >
            {isApproving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Approving...
              </div>
            ) : !isValidAmount && betAmount ? (
              'Please enter a valid amount'
            ) : !hasBalance && isValidAmount ? (
              `Insufficient ${tokenSymbol} balance`
            ) : (
              `Approve ${tokenSymbol}`
            )}
          </button>
        ) : (
          <button
            onClick={handlePlaceBet}
            disabled={!isValidAmount || !hasBalance || selectedOption === null || isPending}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-center transition-all duration-300 ${
              !isValidAmount || !hasBalance || selectedOption === null || isPending
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-500/90 hover:from-green-500/90 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:scale-105'
            }`}
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Placing Bet...
              </div>
            ) : !isValidAmount && betAmount ? (
              'Please enter a valid amount'
            ) : !hasBalance && isValidAmount ? (
              `Insufficient ${tokenSymbol} balance`
            ) : selectedOption === null && isValidAmount && hasBalance ? (
              'Please select an option above'
            ) : selectedOption !== null && options ? (
              `Place Bet on "${options[selectedOption]}"`
            ) : (
              'Place Bet'
            )}
          </button>
        )}
      </div>
    </div>
  )
}