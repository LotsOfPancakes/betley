// frontend/app/bets/[id]/components/BetAmountInput.tsx
'use client'

import { formatUnits } from 'viem'
import { formatDynamicDecimals, isValidBetAmount, hasWalletBalance } from '@/lib/utils/bettingUtils'
import { getTokenConfig } from '@/lib/tokenUtils'

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
  options
}: BetAmountInputProps) {

  // Get token symbol
  const tokenSymbol = getTokenConfig(isNativeBet ? '' : '0x1234567890123456789012345678901234567890').symbol

  // Validation logic
  const isValidAmount = isValidBetAmount(betAmount)
  const hasBalance = hasWalletBalance(betAmount, balance, decimals)

  return (
    <div className="space-y-4">
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
            placeholder="0.00"
            className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all duration-300"
            style={{
              boxShadow: 'inset 0 0 0 1px transparent',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 0 100px rgba(34, 197, 94, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'inset 0 0 0 1px transparent'
            }}
          />
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
            {tokenSymbol}
          </div>
        </div>
        
        {/* Balance Display */}
        {balance && (
          <div className="mt-2 text-sm text-gray-400">
            Balance: {formatDynamicDecimals(formatUnits(balance, decimals))} {tokenSymbol}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || !isValidAmount || !hasBalance}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl disabled:shadow-none"
          >
            {isApproving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Approving...
              </div>
            ) : (
              `Approve ${tokenSymbol}`
            )}
          </button>
        ) : (
          <button
            onClick={handlePlaceBet}
            disabled={isPending || !isValidAmount || !hasBalance || selectedOption === null}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl disabled:shadow-none"
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Placing Bet...
              </div>
            ) : (
              `Place Bet${selectedOption !== null && options ? ` on ${options[selectedOption]}` : ''}`
            )}
          </button>
        )}
        
        {/* Validation Messages */}
        {!isValidAmount && betAmount && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-xl p-3">
            Please enter a valid amount
          </p>
        )}
        
        {!hasBalance && isValidAmount && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-xl p-3">
            Insufficient balance
          </p>
        )}
        
        {selectedOption === null && isValidAmount && hasBalance && (
          <p className="text-yellow-400 text-sm text-center bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
            Please select an option to bet on
          </p>
        )}
      </div>
    </div>
  )
}