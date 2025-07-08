import { formatUnits } from 'viem'

interface UserActionsProps {
  address?: string
  resolved: boolean
  winningOption?: number
  userBets?: readonly bigint[]
  totalAmounts?: readonly bigint[]
  resolutionDeadlinePassed: boolean
  hasClaimed?: boolean
  decimals?: number
  isPending: boolean
  handleClaimWinnings: () => void
}

export function UserActions({
  address,
  resolved,
  winningOption,
  userBets,
  totalAmounts,
  resolutionDeadlinePassed,
  hasClaimed,
  decimals,
  isPending,
  handleClaimWinnings
}: UserActionsProps) {
  if (!address || !userBets) return null

  const getUserTotalBet = () => {
    return userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
  }

  const calculateWinnings = () => {
    if (!resolved || !userBets || winningOption === undefined || !totalAmounts) return BigInt(0)
    
    const userWinningBet = userBets[winningOption]
    if (userWinningBet === BigInt(0)) return BigInt(0)
    
    const totalWinningPool = totalAmounts[winningOption]
    let totalLosingPool = BigInt(0)
    
    // Calculate total losing pool (all non-winning options)
    for (let i = 0; i < totalAmounts.length; i++) {
      if (i !== winningOption) {
        totalLosingPool += totalAmounts[i]
      }
    }
    
    if (totalLosingPool === BigInt(0)) {
      return userWinningBet // Just return original bet if no losers
    }
    
    // Pari-mutuel calculation: original bet + proportional share of losing pool
    const proportionalShare = (userWinningBet * totalLosingPool) / totalWinningPool
    return userWinningBet + proportionalShare
  }

  const userCanClaim = () => {
    const totalBet = getUserTotalBet()
    if (totalBet === BigInt(0)) return false
    
    if (resolved && winningOption !== undefined) {
      // Check if user won
      return userBets[winningOption] > BigInt(0)
    }
    
    if (resolutionDeadlinePassed && !resolved) {
      // Can claim refund
      return true
    }
    
    return false
  }

  const userHasLost = () => {
    if (!resolved || winningOption === undefined) return false
    const totalBet = getUserTotalBet()
    if (totalBet === BigInt(0)) return false
    
    // User has bet money but didn&apos;t win
    return userBets[winningOption] === BigInt(0)
  }

  // Check hasClaimed FIRST
  if (hasClaimed) {
    const winAmount = calculateWinnings()
    const originalBet = getUserTotalBet()
    const profitFromLosingPot = winAmount - originalBet
    
    return (
      <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
        <p className="text-gray-300 mb-2">
          ✅ You have already claimed your {resolved ? 'winnings' : 'refund'}.
        </p>
        {resolved && winAmount > BigInt(0) && decimals && (
          <div className="text-sm text-gray-400 mt-3 space-y-1">
            <p>Original bet: {formatUnits(originalBet, decimals)} HYPE</p>
            <p>Winnings from other bets: +{formatUnits(profitFromLosingPot, decimals)} HYPE</p>
            <p className="font-medium text-gray-300">Total claimed: {formatUnits(winAmount, decimals)} HYPE</p>
          </div>
        )}
      </div>
    )
  }

  // Show losing state
  if (userHasLost()) {
    return (
      <div className="mt-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
        <p className="text-red-300 mb-2">You lost this bet.</p>
        <p className="text-sm text-red-200">
          Your bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
        </p>
      </div>
    )
  }

  // Refund section when deadline passed
  if (resolutionDeadlinePassed && !resolved && userCanClaim()) {
    return (
      <div className="mt-6 p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
        <p className="text-orange-300 mb-3">
          The resolution deadline has passed. You can claim a refund of your original bet.
        </p>
        <p className="text-sm text-orange-200 mb-3">
          Your total bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
        </p>
        <button
          onClick={handleClaimWinnings}
          disabled={isPending}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-600 transition-colors"
        >
          {isPending ? 'Claiming Refund...' : 'Claim Refund'}
        </button>
      </div>
    )
  }

  // Claim winnings section with detailed breakdown
  if (resolved && userCanClaim()) {
    const winAmount = calculateWinnings()
    const originalBet = getUserTotalBet()
    const profitFromLosingPot = winAmount - originalBet
    
    return (
      <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
        <p className="text-green-300 mb-3">Congratulations! You won this bet!</p>
        <div className="text-sm text-green-200 mb-4 space-y-1">
          <p>Your original bet: {decimals ? formatUnits(originalBet, decimals) : '0'} HYPE</p>
          <p>Winnings from other bets: +{decimals ? formatUnits(profitFromLosingPot, decimals) : '0'} HYPE</p>
          <div className="border-t border-green-600 pt-1 mt-2">
            <p className="font-semibold text-green-100">Total winnings: {decimals ? formatUnits(winAmount, decimals) : '0'} HYPE</p>
          </div>
        </div>
        <button
          onClick={handleClaimWinnings}
          disabled={isPending}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 transition-colors"
        >
          {isPending ? 'Claiming...' : `Claim ${decimals ? formatUnits(winAmount, decimals) : '0'} HYPE`}
        </button>
      </div>
    )
  }

  return null
}