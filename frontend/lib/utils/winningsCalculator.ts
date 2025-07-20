// lib/utils/winningsCalculator.ts - Complex winnings calculation logic
import {
  calculateLosingPool,
  calculateAllFees,
  calculateUserTotalBet,
  calculateRawWinnings,
  hasUserWon
} from './betCalculations'

export interface WinningsBreakdown {
  originalBet: bigint
  rawWinningsFromLosers: bigint
  creatorFee: bigint
  platformFee: bigint
  totalWinnings: bigint
  showFees: boolean
}

export interface WinningsCalculationParams {
  userBets: readonly bigint[]
  totalAmounts: readonly bigint[]
  winningOption: number
  feeParams: readonly [boolean, bigint, boolean, bigint, string]
  contractWinnings?: bigint
  resolved: boolean
}

/**
 * Calculate comprehensive winnings breakdown for a user
 * @param params - All parameters needed for winnings calculation
 * @returns Detailed breakdown of winnings or null if user didn't win
 */
export function calculateWinningsBreakdown(
  params: WinningsCalculationParams
): WinningsBreakdown | null {
  const {
    userBets,
    totalAmounts,
    winningOption,
    feeParams,
    contractWinnings,
    resolved
  } = params

  // Early validation
  if (!resolved || !userBets || winningOption === undefined || !totalAmounts || !feeParams) {
    return null
  }

  // Check if user won
  if (!hasUserWon(userBets, winningOption)) {
    return null
  }

  const originalBet = calculateUserTotalBet(userBets)
  const userWinningBet = userBets[winningOption]
  const totalWinningPool = totalAmounts[winningOption]
  const losingPool = calculateLosingPool(totalAmounts, winningOption)

  // Handle edge case: no losing pool
  if (losingPool === BigInt(0)) {
    return {
      originalBet,
      rawWinningsFromLosers: BigInt(0),
      creatorFee: BigInt(0),
      platformFee: BigInt(0),
      totalWinnings: originalBet,
      showFees: false
    }
  }

  // Calculate raw winnings before fees
  const rawWinningsFromLosers = calculateRawWinnings(
    userWinningBet,
    losingPool,
    totalWinningPool
  )

  // Extract fee parameters
  const [creatorEnabled, creatorRate, platformEnabled, platformRate] = feeParams

  // Calculate fees
  const { creatorFee, platformFee } = calculateAllFees(
    losingPool,
    creatorRate,
    creatorEnabled,
    platformRate,
    platformEnabled
  )

  // Use contract calculation for actual winnings if available, otherwise fallback
  const actualWinnings = contractWinnings !== undefined 
    ? contractWinnings 
    : originalBet + rawWinningsFromLosers

  const showFees = contractWinnings !== undefined && (creatorFee > BigInt(0) || platformFee > BigInt(0))

  return {
    originalBet,
    rawWinningsFromLosers,
    creatorFee,
    platformFee,
    totalWinnings: actualWinnings,
    showFees
  }
}

/**
 * Calculate potential winnings preview (for betting interface)
 * @param userBetAmount - Amount user wants to bet
 * @param selectedOption - Option user wants to bet on
 * @param totalAmounts - Current total amounts per option
 * @param feeParams - Current fee parameters
 * @returns Estimated winnings if this option wins
 */
export function calculatePotentialWinningsPreview(
  userBetAmount: bigint,
  selectedOption: number,
  totalAmounts: readonly bigint[],
  feeParams?: readonly [boolean, bigint, boolean, bigint, string]
): bigint {
  if (userBetAmount === BigInt(0) || !totalAmounts || selectedOption < 0 || selectedOption >= totalAmounts.length) {
    return BigInt(0)
  }

  // Simulate new totals after user's bet
  const newTotalAmounts = totalAmounts.map((amount, index) => 
    index === selectedOption ? amount + userBetAmount : amount
  )

  // Calculate what the losing pool would be if selected option wins
  const simulatedLosingPool = calculateLosingPool(newTotalAmounts, selectedOption)
  
  if (simulatedLosingPool === BigInt(0)) {
    return userBetAmount // Just get original bet back
  }

  // Calculate fees if parameters available
  let totalFees = BigInt(0)
  if (feeParams) {
    const [creatorEnabled, creatorRate, platformEnabled, platformRate] = feeParams
    const { totalFees: calculatedFees } = calculateAllFees(
      simulatedLosingPool,
      creatorRate,
      creatorEnabled,
      platformRate,
      platformEnabled
    )
    totalFees = calculatedFees
  }

  // Available winnings after fees
  const availableForWinners = simulatedLosingPool - totalFees
  const newWinningPool = newTotalAmounts[selectedOption]

  // Calculate proportional share
  const winningsFromLosers = (userBetAmount * availableForWinners) / newWinningPool

  return userBetAmount + winningsFromLosers
}

/**
 * Determine user's claim status
 * @param userBets - User's bet amounts per option
 * @param winningOption - Winning option index (if resolved)
 * @param resolved - Whether bet is resolved
 * @param resolutionDeadlinePassed - Whether resolution deadline passed
 * @returns Object describing what user can claim
 */
export function getUserClaimStatus(
  userBets: readonly bigint[],
  winningOption: number | undefined,
  resolved: boolean,
  resolutionDeadlinePassed: boolean
) {
  const totalBet = calculateUserTotalBet(userBets)
  
  if (totalBet === BigInt(0)) {
    return {
      canClaim: false,
      claimType: 'none' as const,
      userWon: false,
      userLost: false
    }
  }

  if (resolved && winningOption !== undefined) {
    const userWon = hasUserWon(userBets, winningOption)
    return {
      canClaim: userWon,
      claimType: userWon ? 'winnings' as const : 'none' as const,
      userWon,
      userLost: !userWon
    }
  }

  if (resolutionDeadlinePassed && !resolved) {
    return {
      canClaim: true,
      claimType: 'refund' as const,
      userWon: false,
      userLost: false
    }
  }

  return {
    canClaim: false,
    claimType: 'none' as const,
    userWon: false,
    userLost: false
  }
}