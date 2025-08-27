// calculateOutcomes.ts - Pure function to calculate all possible bet outcomes

import {
  calculateWinningsBreakdown,
  calculateUserTotalBet,
  hasUserWon,
  type WinningsBreakdown,
} from '@/lib/utils'
import { hasRefundableBets, isBetEmpty } from '@/lib/utils/bettingUtils'
import { type FeeBreakdown } from '../hooks/useBetFeeData'

export interface BetOutcome {
  type: 'winnings' | 'lost' | 'creator-fees' | 'refund'
  amount: bigint
  canClaim: boolean
  alreadyClaimed: boolean
  label: string
  color: 'green' | 'red' | 'yellow' | 'blue'
  breakdown?: WinningsBreakdown | FeeBreakdown
  showBreakdown: boolean
}

export interface CalculateOutcomesParams {
  // Core bet data
  userBets: readonly bigint[]
  totalAmounts: readonly bigint[]
  winningOption?: number
  resolved: boolean
  resolutionDeadlinePassed: boolean
  creator?: string
  address?: string
  
  // Claim states
  hasClaimed: boolean
  hasClaimedCreatorFees: boolean
  
  // Fee data from useBetFeeData hook
  creatorFeeAmount: bigint
  contractWinnings?: bigint
  feeParams?: readonly [boolean, bigint, boolean, bigint, string]
  
  // Helper data
  isCreator: boolean
}

/**
 * Calculate all possible bet outcomes for a user
 * Only returns outcomes with amount > 0
 */
export function calculateOutcomes(params: CalculateOutcomesParams): BetOutcome[] {
  const {
    userBets,
    totalAmounts,
    winningOption,
    resolved,
    resolutionDeadlinePassed,
    hasClaimed,
    hasClaimedCreatorFees,
    creatorFeeAmount,
    contractWinnings,
    feeParams,
    isCreator
  } = params

  const outcomes: BetOutcome[] = []

  // Calculate user's total bet amount
  const userTotalBet = calculateUserTotalBet(userBets)
  
  // Early return if user has no bets
  if (userTotalBet === BigInt(0)) {
    return outcomes
  }

  // 1. WINNINGS - When user won a resolved bet
  if (resolved && winningOption !== undefined && hasUserWon(userBets, winningOption)) {
    const winningsBreakdown = feeParams ? calculateWinningsBreakdown({
      userBets,
      totalAmounts,
      winningOption,
      feeParams,
      contractWinnings,
      resolved
    }) : null

    if (winningsBreakdown && winningsBreakdown.totalWinnings > BigInt(0)) {
      outcomes.push({
        type: 'winnings',
        amount: winningsBreakdown.totalWinnings,
        canClaim: !hasClaimed,
        alreadyClaimed: hasClaimed,
        label: 'Winnings',
        color: 'green',
        breakdown: winningsBreakdown,
        showBreakdown: true
      })
    }
  }

  // 2. LOST AMOUNT - When user lost a resolved bet
  if (resolved && winningOption !== undefined && !hasUserWon(userBets, winningOption)) {
    outcomes.push({
      type: 'lost',
      amount: userTotalBet,
      canClaim: false,
      alreadyClaimed: false,
      label: 'Lost',
      color: 'red',
      showBreakdown: false
    })
  }

  // 3. CREATOR FEES - When creator can claim fees from resolved bet
  if (resolved && winningOption !== undefined && isCreator && creatorFeeAmount > BigInt(0)) {
    // Create fee breakdown for display
    const feeBreakdown: FeeBreakdown = {
      losingPool: BigInt(0), // We'd need to calculate this if we want to show it
      creatorFee: creatorFeeAmount,
      platformFee: BigInt(0), // We'd need to calculate this if we want to show it
      totalFees: creatorFeeAmount
    }

    outcomes.push({
      type: 'creator-fees',
      amount: creatorFeeAmount,
      canClaim: !hasClaimedCreatorFees,
      alreadyClaimed: hasClaimedCreatorFees,
      label: 'Creator Fees',
      color: 'yellow',
      breakdown: feeBreakdown,
      showBreakdown: true
    })
  }

  // 4. REFUND - When bet expired without resolution
  if (resolutionDeadlinePassed && !resolved) {
    // Apply same validation logic as UserActions
    if (hasRefundableBets(userBets) && !isBetEmpty(totalAmounts)) {
      outcomes.push({
        type: 'refund',
        amount: userTotalBet,
        canClaim: !hasClaimed,
        alreadyClaimed: hasClaimed,
        label: 'Refund',
        color: 'blue',
        showBreakdown: false
      })
    }
  }

  return outcomes
}