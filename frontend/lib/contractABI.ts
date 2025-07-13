// frontend/lib/contractABI.ts
import { contractsConfig } from './config'

// Contract addresses from centralized configuration
export const BETLEY_ADDRESS = contractsConfig.betley
export const HYPE_TOKEN_ADDRESS = contractsConfig.hypeToken

// Betley contract ABI
export const BETLEY_ABI = [
  {
    inputs: [{ name: '_hypeToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_options', type: 'string[]' },
      { name: '_duration', type: 'uint256' }
    ],
    name: 'createBet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_option', type: 'uint8' },
      { name: '_amount', type: 'uint256' }
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'getBetDetails',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'options', type: 'string[]' },
      { name: 'creator', type: 'address' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningOption', type: 'uint8' },
      { name: 'totalAmounts', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'betCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    name: 'getUserBets',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    name: 'hasUserClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_winningOption', type: 'uint8' }
    ],
    name: 'resolveBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'getResolutionDeadline',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'claimRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Standard ERC20 ABI (commonly used functions)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const