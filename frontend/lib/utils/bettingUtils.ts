// lib/utils/bettingUtils.ts
// Pure utility functions for betting-related operations
// Extracted from UnifiedBettingInterface.tsx for reusability and testing

/**
 * Format time remaining in human-readable format
 * @param seconds - Time remaining in seconds
 * @returns Formatted time string (e.g., "2h 30m", "45m 12s", "30s")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

/**
 * Bet status configuration for display
 */
export interface BetStatusDisplay {
  text: string
  color: string
  textColor: string
  timeInfo: string | null
  icon: string
}

/**
 * Get bet status display configuration
 * @param isActive - Whether betting is still active
 * @param resolved - Whether bet is resolved
 * @param resolutionDeadlinePassed - Whether resolution deadline has passed
 * @param timeLeft - Time left for betting (seconds)
 * @param resolutionTimeLeft - Time left for resolution (seconds)
 * @returns Status display configuration
 */
export function getBetStatusDisplay(
  isActive: boolean,
  resolved: boolean,
  resolutionDeadlinePassed: boolean,
  timeLeft: number,
  resolutionTimeLeft: number
): BetStatusDisplay {
  if (resolved) {
    return {
      text: 'Resolved',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      textColor: 'text-white',
      timeInfo: null,
      icon: '✅'
    }
  }
  
  if (resolutionDeadlinePassed) {
    return {
      text: 'Refund Available',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-white',
      timeInfo: null,
      icon: '💰'
    }
  }
  
  if (!isActive) {
    return {
      text: 'Pending Resolution',
      color: 'bg-gradient-to-r from-yellow-600 to-orange-600',
      textColor: 'text-white',
      timeInfo: resolutionTimeLeft > 0 ? formatTimeRemaining(resolutionTimeLeft) : null,
      icon: '⏳'
    }
  }
  
  return {
    text: 'Active',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    textColor: 'text-white',
    timeInfo: timeLeft > 0 ? formatTimeRemaining(timeLeft) : null,
    icon: '🎯'
  }
}

/**
 * Format number with dynamic decimal places, removing trailing zeros
 * @param value - Number or string to format
 * @returns Formatted string with appropriate decimal places
 */
export function formatDynamicDecimals(value: string | number): string {
  const num = parseFloat(value.toString())
  if (isNaN(num) || num === 0) return '0'
  
  // Show up to 8 decimals, then remove trailing zeros
  return num.toFixed(8).replace(/\.?0+$/, '')
}

/**
 * Calculate percentage of total pool for an option
 * @param optionAmount - Amount bet on specific option
 * @param totalPool - Total pool amount
 * @returns Percentage as number (0-100)
 */
export function calculateOptionPercentage(optionAmount: bigint, totalPool: bigint): number {
  if (totalPool === BigInt(0)) return 0
  return Number((optionAmount * BigInt(10000)) / totalPool) / 100
}

/**
 * Get the index of the option the user has bet on
 * @param userBets - Array of user's bet amounts
 * @returns Index of bet option, or -1 if no bet placed
 */
export function getUserExistingOptionIndex(userBets: readonly bigint[]): number {
  return userBets?.findIndex(amount => amount > BigInt(0)) ?? -1
}

/**
 * Check if user has placed any bet
 * @param userBets - Array of user's bet amounts
 * @returns True if user has bet on any option
 */
export function hasUserPlacedBet(userBets: readonly bigint[]): boolean {
  return getUserExistingOptionIndex(userBets) !== -1
}

/**
 * Validate bet amount input
 * @param amount - Bet amount as string
 * @returns True if amount is valid (positive number)
 */
export function isValidBetAmount(amount: string): boolean {
  const num = parseFloat(amount || '0')
  return !isNaN(num) && num > 0
}

/**
 * Check if user has sufficient balance for bet
 * @param betAmount - Bet amount as string
 * @param balance - User's balance in wei
 * @param decimals - Token decimals
 * @returns True if user has sufficient balance
 */
export function hasWalletBalance(betAmount: string, balance: bigint, decimals: number): boolean {
  if (!balance || !betAmount) return false
  
  try {
    const betAmountWei = BigInt(Math.floor(parseFloat(betAmount) * Math.pow(10, decimals)))
    return balance >= betAmountWei
  } catch {
    return false
  }
}

/**
 * Check if user can place a bet
 * @param address - User's wallet address
 * @param isActive - Whether betting is active
 * @param resolved - Whether bet is resolved
 * @returns True if user can bet
 */
export function canUserBet(address: string | undefined, isActive: boolean, resolved: boolean): boolean {
  return Boolean(address && isActive && !resolved)
}