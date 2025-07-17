// frontend/app/bets/[id]/components/UserActions.tsx - V2 Fee-Adjusted
'use client'

import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { useState } from 'react'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'

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
  betId: string
  isNativeBet?: boolean
}

interface WinningsBreakdown {
  originalBet: bigint
  rawWinningsFromLosers: bigint
  fees: bigint
  totalWinnings: bigint
  showFees: boolean
}

interface CollapsibleBreakdownProps {
  breakdown: WinningsBreakdown
  decimals: number
  isNativeBet: boolean
}

function CollapsibleBreakdown({ breakdown, decimals, isNativeBet }: CollapsibleBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="border-t border-green-600/30 pt-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-green-300 hover:text-green-200 transition-colors text-sm"
      >
        <span>View breakdown</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="mt-3 text-sm space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <p className="text-green-200">
              Your original bet: {formatUnits(breakdown.originalBet, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
            </p>
            {breakdown.rawWinningsFromLosers > BigInt(0) && (
              <p className="text-green-200">
                Winnings from other bets: +{formatUnits(breakdown.rawWinningsFromLosers, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
              </p>
            )}
            {breakdown.showFees && (
              <p className="text-red-400">
                Creator & Platform Fees: -{formatUnits(breakdown.fees, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
              </p>
            )}
            <div className="border-t border-green-600/30 pt-2 mt-2">
              <p className="font-semibold text-green-100">
                Total winnings: {formatUnits(breakdown.totalWinnings, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
  handleClaimWinnings,
  betId,
  isNativeBet = false
}: UserActionsProps) {
  // V2: Use contract's calculatePotentialWinnings for fee-adjusted amounts
  // MUST be called before any early returns to satisfy React Hook rules
  const { data: contractWinnings } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'calculatePotentialWinnings',
    args: betId && address ? [BigInt(betId), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!betId && resolved, // Only call when resolved
      refetchInterval: 5000,
    }
  })

  // Early return AFTER all hooks
  if (!address || !userBets) return null

  const getUserTotalBet = () => {
    return userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
  }

  // Calculate detailed winnings breakdown for display
  const getWinningsBreakdown = () => {
    if (!resolved || !userBets || winningOption === undefined || !totalAmounts) {
      return null
    }

    const originalBet = getUserTotalBet()
    const userWinningBet = userBets[winningOption]
    
    if (userWinningBet === BigInt(0)) return null

    const totalWinningPool = totalAmounts[winningOption]
    let totalLosingPool = BigInt(0)
    
    // Calculate total losing pool
    for (let i = 0; i < totalAmounts.length; i++) {
      if (i !== winningOption) {
        totalLosingPool += totalAmounts[i]
      }
    }

    if (totalLosingPool === BigInt(0)) {
      return {
        originalBet,
        rawWinningsFromLosers: BigInt(0),
        fees: BigInt(0),
        totalWinnings: originalBet,
        showFees: false
      }
    }

    // Calculate raw winnings (before fees)
    const rawWinningsFromLosers = (userWinningBet * totalLosingPool) / totalWinningPool
    const rawTotal = originalBet + rawWinningsFromLosers

    // Use contract calculation for actual winnings (after fees)
    const actualWinnings = contractWinnings !== undefined ? contractWinnings : rawTotal
    const fees = rawTotal - actualWinnings

    return {
      originalBet,
      rawWinningsFromLosers,
      fees,
      totalWinnings: actualWinnings,
      showFees: contractWinnings !== undefined && fees > BigInt(0)
    }
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
    
    // User has bet money but didn't win
    return userBets[winningOption] === BigInt(0)
  }

  // Check hasClaimed FIRST
  if (hasClaimed) {
    const breakdown = getWinningsBreakdown()
    
    return (
      <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
        <p className="text-gray-300 mb-2">
          ✅ You have already claimed your {resolved ? 'winnings' : 'refund'}.
        </p>
        {breakdown && decimals && (
          <div className="text-sm text-gray-400 mt-3 space-y-1">
            <p>Original bet: {formatUnits(breakdown.originalBet, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
            {breakdown.rawWinningsFromLosers > BigInt(0) && (
              <p>Winnings from other bets: +{formatUnits(breakdown.rawWinningsFromLosers, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
            )}
            {breakdown.showFees && (
              <p>Creator & Platform Fees: -{formatUnits(breakdown.fees, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
            )}
            <div className="border-t border-gray-600 pt-1 mt-2">
              <p className="font-medium text-gray-300">Total claimed: {formatUnits(breakdown.totalWinnings, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show losing state
  if (userHasLost()) {
    return (
      <div className="mt-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
        <p className="text-red-300 mb-2">You lost this bet. Better luck next time!</p>
        <p className="text-sm text-red-200">
          Your bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} {isNativeBet ? 'HYPE' : 'mHYPE'}
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
          Your total bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} {isNativeBet ? 'HYPE' : 'mHYPE'}
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

  // V2: Claim winnings section with collapsible detailed breakdown
  if (resolved && userCanClaim()) {
    const breakdown = getWinningsBreakdown()
    
    if (!breakdown || !decimals) return null
    
    return (
      <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
        <p className="text-green-300 mb-4 text-lg">
          Congratulations - You won {formatUnits(breakdown.totalWinnings, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}!
        </p>
        
        {/* Main Claim Button */}
        <button
          onClick={handleClaimWinnings}
          disabled={isPending}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors mb-4"
        >
          {isPending ? 'Claiming...' : `Claim ${formatUnits(breakdown.totalWinnings, decimals)} ${isNativeBet ? 'HYPE' : 'mHYPE'}`}
        </button>

        {/* Collapsible Breakdown Section */}
        <CollapsibleBreakdown
          breakdown={breakdown}
          decimals={decimals}
          isNativeBet={isNativeBet}
        />
      </div>
    )
  }

  return null
}