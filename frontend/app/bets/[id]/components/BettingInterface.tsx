import { formatUnits, parseUnits } from 'viem'
import { ConnectKitButton } from 'connectkit'

interface BettingInterfaceProps {
  isActive: boolean
  address?: string
  options?: readonly string[]
  userBets?: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  betAmount: string
  setBetAmount: (amount: string) => void
  allowance?: bigint
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  decimals?: number
  totalAmounts?: readonly bigint[]
  timeLeft: number
  resolved: boolean
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
  allowance,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  decimals,
  totalAmounts,
  timeLeft,
  resolved
}: BettingInterfaceProps) {
  // Helper functions
  const getUserExistingOption = () => {
    if (!userBets) return null
    for (let i = 0; i < userBets.length; i++) {
      if (userBets[i] > BigInt(0)) return i
    }
    return null
  }

  const calculateEstimatedWinnings = (optionIndex: number, betAmount: string) => {
    if (!betAmount || !totalAmounts || !decimals) return { total: '0', profit: '0' }
    
    try {
      const betAmountBig = parseUnits(betAmount, decimals)
      const existingUserBet = userBets && userBets[optionIndex] ? userBets[optionIndex] : BigInt(0)
      const totalUserBet = existingUserBet + betAmountBig
      
      // Calculate new total for this option after user's bet
      const newOptionTotal = totalAmounts[optionIndex] + betAmountBig
      
      // Calculate current losing pool (all other options)
      let currentLosingPool = BigInt(0)
      for (let i = 0; i < totalAmounts.length; i++) {
        if (i !== optionIndex) {
          currentLosingPool += totalAmounts[i]
        }
      }
      
      if (currentLosingPool === BigInt(0)) {
        // No losing pool, user just gets their bet back
        return {
          total: formatUnits(totalUserBet, decimals),
          profit: '0'
        }
      }
      
      // Pari-mutuel calculation: original bet + proportional share of losing pool
      const proportionalShare = (totalUserBet * currentLosingPool) / newOptionTotal
      const totalWinnings = totalUserBet + proportionalShare
      const profit = proportionalShare // Only the share from losing pool is profit
      
      return {
        total: formatUnits(totalWinnings, decimals),
        profit: formatUnits(profit, decimals)
      }
    } catch {
      return { total: '0', profit: '0' }
    }
  }

  const userExistingOption = getUserExistingOption()
  const needsApproval = allowance !== undefined && decimals && betAmount 
    ? allowance < parseUnits(betAmount, decimals) 
    : true

  // if (!isActive || !address) {
  //   return (
  //     <div className="text-center mb-8">
  //       {!address ? (
  //         <>
  //           <p className="text-gray-300 mb-4">Connect your wallet to place a bet</p>
  //           <ConnectKitButton />
  //         </>
  //       )
  //        : timeLeft <= 0 && !resolved ? (
  //         <p className="text-gray-300">Betting has ended. Waiting for resolution...</p>
  //       ) : (
  //         <p className="text-gray-300">Betting hasn&apos;t started yet</p>
  //       )}
  //     </div>
  //   )
  // }

  return (
    <div className="mb-8">
      {/* User's existing position */}
      {userExistingOption !== null && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Your Current Position</h3>
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">{options?.[userExistingOption]}</span>
            <span className="text-blue-400 font-medium">
              {decimals && userBets ? formatUnits(userBets[userExistingOption], decimals) : '0'} HYPE
            </span>
          </div>
        </div>
      )}

      {/* Betting options */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Place Your Bet</h3>
        <div className="grid gap-3">
          {options?.map((option: string, index: number) => {
            const isDisabled = userExistingOption !== null && userExistingOption !== index
            const isSelected = selectedOption === index
            const estimates = betAmount && isSelected ? calculateEstimatedWinnings(index, betAmount) : null
            
            return (
              <label
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  isDisabled
                    ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                    : isSelected
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="betting-option"
                    value={index}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => setSelectedOption(index)}
                    className="text-blue-600 disabled:opacity-50"
                  />
                  <div>
                    <span className="text-white font-medium">{option}</span>
                    {estimates && isSelected && (
                      <div className="text-sm text-green-400 mt-1">
                        Potential Profit: +{estimates.profit} HYPE
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Pool: {decimals && totalAmounts ? formatUnits(totalAmounts[index], decimals) : '0'} HYPE
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Bet amount input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bet Amount (HYPE)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="Enter amount to bet"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Betting buttons */}
      <div className="space-y-3">
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || isPending || !betAmount}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isApproving || isPending ? 'Approving...' : 'Approve HYPE'}
          </button>
        ) : (
          <button
            onClick={handlePlaceBet}
            disabled={isPending || !betAmount || selectedOption === null}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPending ? 'Placing Bet...' : 'Place Bet'}
          </button>
        )}
      </div>
    </div>
  )
}