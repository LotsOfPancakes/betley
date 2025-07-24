// frontend/app/bets/types/bet.types.ts

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

export type FilterType = 'all' | 'active' | 'pending' | 'resolved'