// lib/utils/tokenFormatting.ts - Centralized token formatting utilities
import { formatUnits } from 'viem'
import { getTokenConfig, ZERO_ADDRESS } from '@/lib/tokenUtils'
import { config } from '@/lib/config'

/**
 * Get token symbol based on bet type
 * @param isNativeBet - Whether this is a native HYPE bet
 * @returns Token symbol string
 */
export const getTokenSymbol = (isNativeBet: boolean): string => {
  return getTokenConfig(isNativeBet ? ZERO_ADDRESS : config.contracts.mockERC20).symbol
}

/**
 * Format amount with token symbol consistently
 * @param amount - Amount in wei
 * @param decimals - Token decimals
 * @param isNativeBet - Whether this is native HYPE
 * @returns Formatted string with amount and symbol
 */
export const formatTokenAmount = (amount: bigint, decimals: number, isNativeBet: boolean): string => {
  return `${formatUnits(amount, decimals)} ${getTokenSymbol(isNativeBet)}`
}

/**
 * Hook-like utility for token formatting (can be used in components)
 * @param isNativeBet - Whether this is a native HYPE bet
 * @returns Object with formatting functions
 */
export const createTokenFormatter = (isNativeBet: boolean) => {
  return {
    formatAmount: (amount: bigint, decimals: number) => formatTokenAmount(amount, decimals, isNativeBet),
    getSymbol: () => getTokenSymbol(isNativeBet),
    formatUnitsOnly: (amount: bigint, decimals: number) => formatUnits(amount, decimals)
  }
}