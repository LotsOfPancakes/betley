// BetOutcomes.tsx - Main component for displaying bet outcomes after resolution/expiration

'use client'

import { useMemo } from 'react'
import { useBetFeeData } from '../hooks/useBetFeeData'
import { isBetEmpty } from '@/lib/utils/bettingUtils'
import { OutcomeLine } from './OutcomeLine'
import { calculateOutcomes, type CalculateOutcomesParams } from '../utils/calculateOutcomes'

export interface BetOutcomesProps {
  // Core bet data
  address?: string
  resolved: boolean
  winningOption?: number
  userBets?: readonly bigint[]
  totalAmounts?: readonly bigint[]
  resolutionDeadlinePassed: boolean
  creator?: string
  
  // Claim states
  hasClaimed?: boolean
  hasClaimedCreatorFees?: boolean
  
  // Action handlers
  handleClaimWinnings: () => void
  handleClaimRefund: () => void
  handleClaimCreatorFees: () => void
  
  // Display props
  decimals?: number
  isPending: boolean
  betId: string
  isNativeBet?: boolean
}

export function BetOutcomes({
  address,
  resolved,
  winningOption,
  userBets = [],
  totalAmounts = [],
  resolutionDeadlinePassed,
  hasClaimed = false,
  hasClaimedCreatorFees = false,
  creator,
  handleClaimWinnings,
  handleClaimRefund,
  handleClaimCreatorFees,
  decimals = 18,
  isPending,
  betId,
  isNativeBet = false
}: BetOutcomesProps) {
  
  // Get fee data from the same hook UserActions uses
  const {
    creatorFeeAmount,
    contractWinnings,
    feeParams
  } = useBetFeeData(betId, address, totalAmounts, winningOption, resolved)
  
  // Check if user is the creator
  const isCreator = Boolean(address && creator && address.toLowerCase() === creator.toLowerCase())
  
  // Calculate all possible outcomes (must be before conditional returns)
  const outcomes = useMemo(() => {
    const params: CalculateOutcomesParams = {
      userBets,
      totalAmounts,
      winningOption,
      resolved,
      resolutionDeadlinePassed,
      creator,
      address,
      hasClaimed,
      hasClaimedCreatorFees,
      creatorFeeAmount,
      contractWinnings,
      feeParams,
      isCreator
    }
    
    return calculateOutcomes(params)
  }, [
    userBets,
    totalAmounts, 
    winningOption,
    resolved,
    resolutionDeadlinePassed,
    hasClaimed,
    hasClaimedCreatorFees,
    creatorFeeAmount,
    isCreator,
    contractWinnings,
    feeParams,
    creator,
    address
  ])
  
  // Handle empty expired bet case (same logic as UserActions)
  const isEmptyExpiredBet = resolutionDeadlinePassed && !resolved && isBetEmpty(totalAmounts)
  
  if (isEmptyExpiredBet) {
    return (
      <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm rounded-3xl p-6">
        <p className="text-gray-400 text-center">
          This bet expired without any participants. No action needed.
        </p>
      </div>
    )
  }
  
  // Get the appropriate claim handler for each outcome type
  const getClaimHandler = (outcomeType: string) => {
    switch (outcomeType) {
      case 'winnings':
        return handleClaimWinnings
      case 'refund':
        return handleClaimRefund
      case 'creator-fees':
        return handleClaimCreatorFees
      default:
        return undefined
    }
  }
  
  // If no outcomes to display, don't render anything
  if (outcomes.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Bet Result</h3>
      
      <div className="space-y-3">
        {outcomes.map(outcome => (
          <OutcomeLine
            key={outcome.type}
            outcome={outcome}
            onClaim={getClaimHandler(outcome.type)}
            isPending={isPending}
            decimals={decimals}
            isNativeBet={isNativeBet}
          />
        ))}
      </div>
    </div>
  )
}