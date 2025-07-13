// frontend/app/bets/[id]/components/BettingInterface.tsx
'use client'

import { formatUnits, parseUnits } from 'viem'

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
  justPlacedBet
}: BettingInterfaceProps) {
  // ✅ REMOVED: console.log debug statement
  // Professional production code doesn't include debug logging

  // Only hide if definitely not active or no address
  if (!isActive || !address) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
        <p className="text-gray-400">
          {!address ? 'Connect your wallet to place bets' : 'Betting has ended'}
        </p>
      </div>
    )
  }

  // Show loading state if data is missing
  if (!options || !userBets || !totalAmounts || decimals === undefined) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-400">Loading betting options...</p>
        <p className="text-xs text-gray-500 mt-2">
          Missing: {!options && 'options '} {!userBets && 'userBets '} {!totalAmounts && 'totalAmounts '} {decimals === undefined && 'decimals'}
        </p>
      </div>
    )
  }

  // Calculate which option user has already bet on
  const userBetOption = userBets.findIndex(amount => amount > BigInt(0))
  const hasExistingBet = userBetOption !== -1

  // Calculate potential winnings
  const calculateEstimatedWinnings = (optionIndex: number, betAmount: string) => {
    if (!betAmount || isNaN(parseFloat(betAmount))) return null
    
    const betAmountBigInt = parseUnits(betAmount, decimals)
    const currentPool = totalAmounts[optionIndex]
    const newPool = currentPool + betAmountBigInt
    
    // Calculate total losing pool
    let totalLosingPool = BigInt(0)
    for (let i = 0; i < totalAmounts.length; i++) {
      if (i !== optionIndex) {
        totalLosingPool += totalAmounts[i]
      }
    }
    
    if (newPool === BigInt(0)) return null
    
    const share = betAmountBigInt * totalLosingPool / newPool
    const totalReturn = betAmountBigInt + share
    const profit = share
    
    return {
      totalReturn: formatUnits(totalReturn, decimals),
      profit: formatUnits(profit, decimals)
    }
  }

  return (
    <div className="space-y-6">
      {/* Betting Options - Single, Clean Display */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          🎯 Choose Your Prediction
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option, index) => {
            const isSelected = selectedOption === index
            const isUsersBet = hasExistingBet && userBetOption === index
            const isDisabled = hasExistingBet && userBetOption !== index
            const currentPool = formatUnits(totalAmounts[index], decimals)
            const estimates = isSelected && betAmount ? calculateEstimatedWinnings(index, betAmount) : null

            return (
              <div
                key={index}
                onClick={() => {
                  if (!isDisabled) {
                    setSelectedOption(isSelected ? null : index)
                  }
                }}
                className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 ${
                  isDisabled
                    ? 'bg-gray-700/50 border-gray-600 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20'
                    : isUsersBet
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-gray-800 border-gray-600 hover:border-blue-500 hover:bg-blue-900/10'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-white mb-3">{option}</h4>
                  
                  <div className="text-2xl font-bold text-white mb-2">
                    {currentPool} HYPE
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-3">
                    Current Pool
                  </div>
                  
                  {isUsersBet && (
                    <div className="text-sm text-green-400 mb-2">
                      ✅ Your bet: {formatUnits(userBets[index], decimals)} HYPE
                    </div>
                  )}
                  
                  {estimates && isSelected && (
                    <div className="text-sm text-emerald-400">
                      💰 Potential profit: +{estimates.profit} HYPE
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Betting Input Section */}
      {selectedOption !== null && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">💸 Place Your Bet</h4>
          
          <div className="space-y-4">
            {/* Selected Option Display */}
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                <span className="font-medium">Betting on:</span> {options[selectedOption]}
              </p>
            </div>

            {/* Amount Input - Modern Style */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                Amount
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
                  <span className="text-gray-400 font-medium">HYPE</span>
                </div>
              </div>
              
              {/* Balance display */}
              {hypeBalance !== undefined && (
                <div className="text-sm text-gray-400">
                  Balance: {formatUnits(hypeBalance, decimals)} HYPE
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
                    `🔑 Approve ${betAmount ? `${betAmount} ` : ''}HYPE`
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePlaceBet}
                  disabled={!betAmount || parseFloat(betAmount) <= 0 || isPending}
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
                    `🎲 Place Bet${betAmount ? ` (${betAmount} HYPE)` : ''}`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {hasExistingBet && (
        <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-3">
          <p className="text-amber-300 text-sm">
            ℹ️ You can only bet on one option per bet. You&apos;ve already bet on &quot;{options[userBetOption]}&quot;.
          </p>
        </div>
      )}
    </div>
  )
}