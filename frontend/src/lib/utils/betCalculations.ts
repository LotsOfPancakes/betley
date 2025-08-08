// lib/utils/betCalculations.ts - Pure calculation utilities for betting logic
// All functions are pure - no side effects, no React hooks

/**
 * Calculate the total losing pool for a resolved bet
 * @param totalAmounts - Array of total amounts bet on each option
 * @param winningOption - Index of the winning option
 * @returns Total amount from all losing options
 */
export function calculateLosingPool(
  totalAmounts: readonly bigint[], 
  winningOption: number
): bigint {
  if (!totalAmounts || winningOption === undefined || winningOption < 0) {
    return BigInt(0)
  }

  let losingPool = BigInt(0)
  for (let i = 0; i < totalAmounts.length; i++) {
    if (i !== winningOption) {
      losingPool += totalAmounts[i]
    }
  }
  return losingPool
}

/**
 * Calculate creator fee from losing pool
 * @param losingPool - Total amount in losing pool
 * @param feeRate - Fee rate in basis points (e.g., 200 = 2%)
 * @param enabled - Whether creator fees are enabled
 * @returns Creator fee amount
 */
export function calculateCreatorFee(
  losingPool: bigint,
  feeRate: bigint,
  enabled: boolean
): bigint {
  if (!enabled || feeRate === BigInt(0) || losingPool === BigInt(0)) {
    return BigInt(0)
  }
  return (losingPool * feeRate) / BigInt(10000)
}

/**
 * Calculate platform fee from losing pool
 * @param losingPool - Total amount in losing pool
 * @param feeRate - Fee rate in basis points (e.g., 100 = 1%)
 * @param enabled - Whether platform fees are enabled
 * @returns Platform fee amount
 */
export function calculatePlatformFee(
  losingPool: bigint,
  feeRate: bigint,
  enabled: boolean
): bigint {
  if (!enabled || feeRate === BigInt(0) || losingPool === BigInt(0)) {
    return BigInt(0)
  }
  return (losingPool * feeRate) / BigInt(10000)
}

/**
 * Calculate total fees from losing pool
 * @param losingPool - Total amount in losing pool
 * @param creatorRate - Creator fee rate in basis points
 * @param creatorEnabled - Whether creator fees are enabled
 * @param platformRate - Platform fee rate in basis points
 * @param platformEnabled - Whether platform fees are enabled
 * @returns Object with individual and total fees
 */
export function calculateAllFees(
  losingPool: bigint,
  creatorRate: bigint,
  creatorEnabled: boolean,
  platformRate: bigint,
  platformEnabled: boolean
) {
  const creatorFee = calculateCreatorFee(losingPool, creatorRate, creatorEnabled)
  const platformFee = calculatePlatformFee(losingPool, platformRate, platformEnabled)
  const totalFees = creatorFee + platformFee

  return {
    creatorFee,
    platformFee,
    totalFees,
    losingPool
  }
}

/**
 * Calculate user's total bet across all options
 * @param userBets - Array of user's bet amounts per option
 * @returns Total amount user has bet
 */
export function calculateUserTotalBet(userBets: readonly bigint[]): bigint {
  if (!userBets || userBets.length === 0) {
    return BigInt(0)
  }
  return userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
}

/**
 * Calculate percentage of total pool for a specific option
 * @param optionAmount - Amount bet on specific option
 * @param totalPool - Total amount across all options
 * @returns Percentage as number (0-100)
 */
export function calculateOptionPercentage(
  optionAmount: bigint,
  totalPool: bigint
): number {
  if (totalPool === BigInt(0)) {
    return 0
  }
  return Number((optionAmount * BigInt(10000)) / totalPool) / 100
}

/**
 * Calculate raw winnings before fees
 * @param userBet - User's bet amount on winning option
 * @param losingPool - Total losing pool
 * @param totalWinningPool - Total amount bet on winning option
 * @returns Raw winnings from losing pool (before fees)
 */
export function calculateRawWinnings(
  userBet: bigint,
  losingPool: bigint,
  totalWinningPool: bigint
): bigint {
  if (userBet === BigInt(0) || totalWinningPool === BigInt(0) || losingPool === BigInt(0)) {
    return BigInt(0)
  }
  return (userBet * losingPool) / totalWinningPool
}

/**
 * Calculate total pool across all options
 * @param totalAmounts - Array of amounts bet on each option
 * @returns Total pool amount
 */
export function calculateTotalPool(totalAmounts: readonly bigint[]): bigint {
  if (!totalAmounts || totalAmounts.length === 0) {
    return BigInt(0)
  }
  return totalAmounts.reduce((total, amount) => total + amount, BigInt(0))
}

/**
 * Check if user has won (has bet on winning option)
 * @param userBets - Array of user's bet amounts per option
 * @param winningOption - Index of winning option
 * @returns True if user has bet on winning option
 */
export function hasUserWon(
  userBets: readonly bigint[],
  winningOption: number
): boolean {
  if (!userBets || winningOption === undefined || winningOption < 0 || winningOption >= userBets.length) {
    return false
  }
  return userBets[winningOption] > BigInt(0)
}

/**
 * Check if user has any bets placed
 * @param userBets - Array of user's bet amounts per option
 * @returns True if user has placed any bets
 */
export function hasUserBet(userBets: readonly bigint[]): boolean {
  return calculateUserTotalBet(userBets) > BigInt(0)
}