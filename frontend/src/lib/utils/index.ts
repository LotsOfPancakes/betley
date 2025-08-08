// lib/utils/index.ts - Export all utility functions

// Betting calculations
export {
  calculateLosingPool,
  calculateCreatorFee,
  calculatePlatformFee,
  calculateAllFees,
  calculateUserTotalBet,
  calculateOptionPercentage,
  calculateRawWinnings,
  calculateTotalPool,
  hasUserWon,
  hasUserBet
} from './betCalculations'

// Winnings calculations
export {
  calculateWinningsBreakdown,
  calculatePotentialWinningsPreview,
  getUserClaimStatus,
  type WinningsBreakdown,
  type WinningsCalculationParams
} from './winningsCalculator'