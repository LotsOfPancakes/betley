// frontend/app/bets/types/bet.types.ts

// ✅ UNIFIED: Base bet interface for both public and private bets
export interface BaseBet {
  randomId: string
  name: string
  options: string[]
  creator: string
  endTime: number // Unix timestamp
  resolved: boolean
  winningOption: number
  totalAmounts: number[]
  isPublic: boolean
}

// ✅ Private bet with authentication-specific fields
export interface PrivateBet extends BaseBet {
  id: number // ✅ numeric_id available for authenticated users
  userRole: 'creator' | 'bettor' | 'both'
  userTotalBet: number
  token?: string // Optional token address
}

// ✅ Public bet without sensitive fields
export interface PublicBet extends BaseBet {
  // ✅ SECURITY: NO id field (no numeric_id for public bets)
  userRole: null // ✅ Always null for public view
  userTotalBet: 0 // ✅ Always 0 for public view
  createdAt?: string // ✅ Additional metadata
}

// ✅ LEGACY: Keep existing interface for backward compatibility
export interface BetDetails {
  id: number
  randomId?: string // optional random ID  
  name: string
  options: readonly string[]
  creator: string
  endTime: bigint
  resolved: boolean
  winningOption: number
  totalAmounts: readonly bigint[]
  token?: string // Optional token address
  userRole: 'creator' | 'bettor' | 'both'
  userTotalBet: bigint
  isPublic?: boolean //checks if bet type is public
}

// ✅ Union type for unified component
export type UnifiedBet = PrivateBet | PublicBet

export type FilterType = 'all' | 'active' | 'pending' | 'resolved' | 'expired'