// frontend/app/bets/[id]/components/UserActions.tsx - Complete file with combined win/loss logic
'use client'

import { formatUnits } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { useNotification } from '@/lib/hooks/useNotification'
import { useBetFeeData, type FeeBreakdown } from '../hooks/useBetFeeData'

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
  creator?: string
}

interface WinningsBreakdown {
  originalBet: bigint
  rawWinningsFromLosers: bigint
  creatorFee: bigint
  platformFee: bigint
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
              <>
                <p className="text-red-400">
                  Creator Fee (2%): -{formatUnits(breakdown.creatorFee, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                </p>
                <p className="text-red-400">
                  Platform Fee (1%): -{formatUnits(breakdown.platformFee, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
                </p>
              </>
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

interface CreatorFeesCollapsibleProps {
  betId: string
  decimals: number
  isNativeBet: boolean
  feeBreakdown: FeeBreakdown
}

function CreatorFeesCollapsible({ 
  feeBreakdown,
  decimals, 
  isNativeBet
}: CreatorFeesCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="border-t border-yellow-600/30 pt-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-yellow-300 hover:text-yellow-200 transition-colors text-sm"
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
            <p className="text-yellow-200">
              Losing Pool: {formatUnits(feeBreakdown.losingPool, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
            </p>
            <p className="text-yellow-200">
              Creator Fees: {formatUnits(feeBreakdown.creatorFee, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
            </p>
            <p className="text-gray-300">
              Platform Fees: {formatUnits(feeBreakdown.platformFee, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}
            </p>
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
  isNativeBet = false,
  creator
}: UserActionsProps) {
  
  // Use our new custom hook for all fee-related data
  const {
    contractWinnings,
    creatorFeeAmount,
    feeBreakdown,
    feesEnabled,
    hasValidData,
    error: feeDataError
  } = useBetFeeData(betId, address, totalAmounts, winningOption, resolved)

  // Check if user is creator
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()
  const { showError, showSuccess } = useNotification()

  // Creator fee claiming functionality
  const { 
    writeContract: writeCreatorClaim, 
    isPending: isCreatorClaimPending,
    data: creatorClaimTxHash
  } = useWriteContract()

  const { isSuccess: isCreatorClaimSuccess } = useWaitForTransactionReceipt({ 
    hash: creatorClaimTxHash 
  })

  // Handle creator fee claiming success
  useEffect(() => {
    if (isCreatorClaimSuccess) {
      showSuccess('Creator fees claimed successfully!')
    }
  }, [isCreatorClaimSuccess, showSuccess])

  // Handle fee data errors
  useEffect(() => {
    if (feeDataError) {
      console.error('Fee data error:', feeDataError)
      // Don't show error to user as we can fall back to basic functionality
    }
  }, [feeDataError])

  const handleClaimCreatorFees = async () => {
    if (!betId || isCreatorClaimPending) return
    
    try {
      await writeCreatorClaim({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimCreatorFees',
        args: [BigInt(betId)],
      })
    } catch (error) {
      console.error('Error claiming creator fees:', error)
      showError('Failed to claim creator fees. Please try again.')
    }
  }

  // Early return AFTER all hooks
  if (!address || !userBets) return null

  const getUserTotalBet = () => {
    return userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
  }

  // Simplified winnings breakdown calculation using custom hook data
  const getWinningsBreakdown = (): WinningsBreakdown | null => {
    if (!resolved || !userBets || winningOption === undefined || !totalAmounts || !hasValidData) {
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
        creatorFee: BigInt(0),
        platformFee: BigInt(0),
        totalWinnings: originalBet,
        showFees: false
      }
    }

    // Calculate raw winnings (before fees)
    const rawWinningsFromLosers = (userWinningBet * totalLosingPool) / totalWinningPool

    // Use contract calculation for actual winnings (after fees)
    const actualWinnings = contractWinnings !== undefined ? contractWinnings : originalBet + rawWinningsFromLosers

    return {
      originalBet,
      rawWinningsFromLosers,
      creatorFee: feeBreakdown.creatorFee,
      platformFee: feeBreakdown.platformFee,
      totalWinnings: actualWinnings,
      showFees: feesEnabled && feeBreakdown.totalFees > BigInt(0)
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

  // Check hasClaimed FIRST - but differentiate between winnings and creator fees
  if (hasClaimed) {
    const breakdown = getWinningsBreakdown()
    const userWon = resolved && winningOption !== undefined && userBets && userBets[winningOption] > BigInt(0)
    
    // If user won, they claimed winnings. If creator lost, they claimed creator fees.
    const claimType = userWon ? 'winnings' : (isCreator ? 'Creator Fees' : 'refund')
    
    return (
      <div className="mt-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/30 rounded-3xl p-6">
        <p className="text-gray-300 mb-2">
          ✅ You have already claimed your {claimType}.
        </p>
        {breakdown && decimals && userWon && (
            <div>
              <p className="font-medium text-gray-300 text-sm">Winnings: {formatUnits(breakdown.totalWinnings, decimals)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
            </div>
        )}
        {/* Show creator fee amount for creators who claimed fees */}
        {isCreator && !userWon && resolved && creatorFeeAmount > BigInt(0) && (
          <div className="text-sm text-gray-400 mt-3">
            <p>Creator fees claimed: {formatUnits(creatorFeeAmount, decimals || 18)} {isNativeBet ? 'HYPE' : 'mHYPE'}</p>
          </div>
        )}
      </div>
    )
  }

  // Combined winning/losing state with creator fees
  if (resolved) {
    const userWon = winningOption !== undefined && userBets && userBets[winningOption] > BigInt(0)
    const userHasBet = getUserTotalBet() > BigInt(0)
    const breakdown = getWinningsBreakdown()
    
    return (
      <div className="space-y-4">
        {/* User Result Message - Only show if user actually bet AND not a creator */}
        {userHasBet && userWon && !isCreator ? (
          <div className="mt-6 bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/40 rounded-3xl p-6">
            <p className="text-green-300 mb-4">
              Congratulations - You won {breakdown && decimals ? formatUnits(breakdown.totalWinnings, decimals) : '0'} {isNativeBet ? 'HYPE' : 'mHYPE'}!
            </p>
            
            {/* Claim Winnings Button */}
            <button
              onClick={handleClaimWinnings}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-green-500/30 disabled:shadow-none mb-4"
            >
              {isPending ? 'Claiming...' : `Claim ${breakdown && decimals ? formatUnits(breakdown.totalWinnings, decimals) : '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'} Winnings`}
            </button>

            {/* Winnings Breakdown */}
            {breakdown?.showFees && (
              <CollapsibleBreakdown
                breakdown={breakdown}
                decimals={decimals || 18}
                isNativeBet={isNativeBet}
              />
            )}
          </div>
        ) : userHasBet && !isCreator ? (
          /* Show loss message only if user bet but didn't win AND is not creator */
          <div className="mt-6 bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-3xl p-6">
            <p className="text-red-300">You lost {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} {isNativeBet ? 'HYPE' : 'mHYPE'} this bet. Better luck next time!</p>
          </div>
        ) : null}

        {/* Creator Fee Section - Show for all creators with combined messaging */}
        {isCreator && creatorFeeAmount && creatorFeeAmount > BigInt(0) && !hasClaimed && (
          <div className="mt-8 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm rounded-3xl p-6">
            {userHasBet && (
              <p className="text-yellow-200 mb-2">
                {userWon 
                  ? `You won ${breakdown && decimals ? formatUnits(breakdown.totalWinnings, decimals) : '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'} from your personal bet.`
                  : `You lost ${decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'} this bet. Better luck next time!`
                }
              </p>
            )}
            <p className="text-yellow-300 mb-4">
              Creator Fees available: {formatUnits(creatorFeeAmount, decimals || 18)} {isNativeBet ? 'HYPE' : 'mHYPE'}!
            </p>
            
            {/* Show both buttons if creator won, otherwise just creator fees button */}
            {userWon ? (
              <div className="space-y-3">
                {/* Claim Personal Winnings Button */}
                <button
                  onClick={handleClaimWinnings}
                  disabled={isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-green-500/30 disabled:shadow-none"
                >
                  {isPending ? 'Claiming...' : `Claim ${breakdown && decimals ? formatUnits(breakdown.totalWinnings, decimals) : '0'} ${isNativeBet ? 'HYPE' : 'mHYPE'} Personal Winnings`}
                </button>
                
                {/* Creator Fee Claim Button */}
                <button
                  onClick={handleClaimCreatorFees}
                  disabled={isPending || isCreatorClaimPending}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/30 disabled:shadow-none"
                >
                  {isCreatorClaimPending ? 'Claiming...' : `Claim ${formatUnits(creatorFeeAmount, decimals || 18)} ${isNativeBet ? 'HYPE' : 'mHYPE'} Creator Fees`}
                </button>
              </div>
            ) : (
              /* Creator Fee Claim Button - Only show this if creator didn't win */
              <button
                onClick={handleClaimCreatorFees}
                disabled={isPending || isCreatorClaimPending}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/30 disabled:shadow-none mb-4"
              >
                {isCreatorClaimPending ? 'Claiming...' : `Claim ${formatUnits(creatorFeeAmount, decimals || 18)} ${isNativeBet ? 'HYPE' : 'mHYPE'} Creator Fees`}
              </button>
            )}

            {/* Creator Fee Breakdown */}
            <CreatorFeesCollapsible
              betId={betId}
              decimals={decimals || 18}
              isNativeBet={isNativeBet}
              feeBreakdown={feeBreakdown}
            />
          </div>
        )}
      </div>
    )
  }

  // Refund section when deadline passed
  if (resolutionDeadlinePassed && !resolved && userCanClaim()) {
    return (
      <div className="mt-6 bg-gradient-to-br from-orange-900/40 to-yellow-900/40 backdrop-blur-sm border border-orange-500/40 rounded-3xl p-6">
        <p className="text-orange-300 mb-3">
          The resolution deadline has passed. You can claim a refund of your original bet.
        </p>
        <p className="text-sm text-orange-200 mb-3">
          Your total bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} {isNativeBet ? 'HYPE' : 'mHYPE'}
        </p>
        <button
          onClick={handleClaimWinnings}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-orange-500/30 disabled:shadow-none"
        >
          {isPending ? 'Claiming Refund...' : 'Claim Refund'}
        </button>
      </div>
    )
  }

  return null
}