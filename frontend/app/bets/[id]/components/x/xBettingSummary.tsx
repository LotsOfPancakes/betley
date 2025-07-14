import { formatUnits } from 'viem'

interface BettingSummaryProps {
  totalAmounts?: readonly bigint[]
  options?: readonly string[]
  userBets?: readonly bigint[]
  decimals?: number
}

export function BettingSummary({
  totalAmounts,
  options,
  userBets,
  decimals
}: BettingSummaryProps) {
  if (!totalAmounts || !options) return null

  const getUserTotalBet = () => {
    if (!userBets) return BigInt(0)
    return userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Betting Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Option</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Total Bets</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Your Bet</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option: string, index: number) => {
                const userAmount = userBets && userBets[index] ? userBets[index] : BigInt(0)
                
                return (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{option}</td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {decimals ? formatUnits(totalAmounts[index], decimals) : '0'} HYPE
                    </td>
                    <td className="py-3 px-4 text-right">
                      {userAmount > BigInt(0) && (
                        <span className="text-blue-400 font-medium">
                          {decimals ? formatUnits(userAmount, decimals) : '0'} HYPE
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="font-semibold">
                <td className="py-3 px-4 text-white">Total</td>
                <td className="py-3 px-4 text-right text-white">
                  {decimals && totalAmounts ? 
                    formatUnits(totalAmounts.reduce((a: bigint, b: bigint) => a + b, BigInt(0)), decimals) : 
                    '0'
                  } HYPE
                </td>
                <td className="py-3 px-4 text-right text-blue-400">
                  {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}