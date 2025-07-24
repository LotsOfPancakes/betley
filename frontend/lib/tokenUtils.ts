// frontend/lib/tokenUtils.ts
'use client'

import { config } from './config'

// Zero address convention for native tokens
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/**
 * Check if a token address represents native HYPE
 * @param tokenAddress The token contract address or zero address
 * @returns True if the address represents native HYPE tokens
 */
export function isNativeHype(tokenAddress: string): boolean {
  return tokenAddress === ZERO_ADDRESS
}

/**
 * Determine if a token requires approval before transfer
 * @param tokenAddress The token contract address
 * @param amount The amount to transfer (as string)
 * @returns True if approval is needed (ERC20 tokens with amount > 0)
 */
export function needsApproval(tokenAddress: string, amount: string): boolean {
  return !isNativeHype(tokenAddress) && parseFloat(amount) > 0
}

/**
 * Get token configuration based on address
 * @param tokenAddress The token contract address or zero address
 * @returns Token configuration object
 */
export function getTokenConfig(tokenAddress: string) {
  if (isNativeHype(tokenAddress)) {
    return {
      address: ZERO_ADDRESS,
      symbol: 'HYPE',
      name: 'Native HYPE',
      decimals: 18,
      isNative: true
    }
  }
  
  // Current Mock ERC20 token
  return {
    address: config.contracts.mockERC20,
    symbol: 'mockERC',
    name: 'Mock ERC Token',
    decimals: 18,
    isNative: false
  }
}

/**
 * Get available token options for selection
 * @returns Array of available token configurations
 */
export function getAvailableTokens() {
  return [
    getTokenConfig(ZERO_ADDRESS),           // Native HYPE
    getTokenConfig(config.contracts.mockERC20)  // Mock HYPE ERC20
  ]
}

/**
 * Format token display name with helpful indicators
 * @param tokenAddress The token contract address
 * @returns Formatted display string
 */
export function getTokenDisplayName(tokenAddress: string): string {
  const token = getTokenConfig(tokenAddress)
  if (token.isNative) {
    return `${token.name} (${token.symbol}) - No approval needed`
  }
  return `${token.name} (${token.symbol})`
}