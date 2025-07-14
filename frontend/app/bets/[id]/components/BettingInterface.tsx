// frontend/app/bets/[id]/components/BettingInterface.tsx - Step 6: Native HYPE Support
'use client'

import { formatUnits } from 'viem'

interface BettingInterfaceProps {
  isActive: boolean
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
  isNativeBet?: boolean // 🚀 NEW: Native bet detection
}

export function BettingInterface({
  isActive,
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
  isNativeBet = false // 🚀 NEW: Default to false for backward compatibility
}: BettingInterfaceProps) {

  // Only hide if definitely not active or no address
  if (!isActive || !address) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
        <p className="text-gray-400">
          {!address ? 'Connect your wallet to place bets' : 'Betting period has ended'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold mb-6 text-center">
        {hasExistingBet ? '🎯 You have already placed a bet' : '🎲 Place Your Bet'}
      </h3>

      {/* Show existing bet info if user has bet */}
      {hasExistingBet && userBets && options && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-300">Your Current Bet:</h4>
          {userBets.map((amount, index) => {
            if (amount === BigInt(0)) return null
            return (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{options[index]}</span>
                <span className="font-mono text-blue-300">
                  {formatUnits(amount, decimals || 18)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Only show betting interface if no existing bet */}
      {!hasExistingBet && (
        <div className="space-y-6">
          {/* Option Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose your option:
            </label>
            <div className="grid gap-2">
              {options?.map((option, index) => {
                const totalForOption = totalAmounts?.[index] || BigInt(0)
                const totalFormatted = formatUnits(totalForOption, decimals || 18)
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedOption === index
                        ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                        : 'border-gray-600 bg-gray-900 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{option}</span>
                      <span className="text-sm text-gray-400">
                        Pool: {parseFloat(totalFormatted).toFixed(2)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Bet amount:
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
                  {isNativeBet ? 'HYPE' : 'mHYPE'} {/* 🚀 NEW: Show correct token symbol */}
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
                disabled={!betAmount || parseFloat(betAmount) <= 0 || isApproving}
                className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-700 transition-colors text-lg"
              >
                {isApproving ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Approving...
                  </span>
                ) : (
                  `🔑 Approve ${betAmount ? `${betAmount} ` : ''}${isNativeBet ? 'HYPE' : 'mHYPE'}`
                )}
              </button>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || isPending || selectedOption === null}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-lg"
              >
                {justPlacedBet ? (
                  <span className="flex items-center justify-center">
                    ✅ Bet Placed Successfully!
                  </span>
                ) : isPending ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Placing Bet...
                  </span>
                ) : (
                  `🎲 Place Bet${betAmount ? ` (${betAmount} ${isNativeBet ? 'HYPE' : 'mHYPE'})` : ''}`
                )}
              </button>
            )}

            {/* 🚀 NEW: Enhanced helper text for native HYPE */}
            {!needsApproval && selectedOption !== null && betAmount && !isNativeBet && (
              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-600 rounded-lg">
                <p className="text-blue-300 text-sm text-center">
                  ✅ ERC20 tokens approved - ready to bet!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {hasExistingBet && (
        <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-3">
          <p className="text-amber-300 text-sm">
            ℹ️ You can only bet on one option per bet.
          </p>
        </div>
      )}
    </div>
  )
}