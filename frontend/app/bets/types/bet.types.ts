// frontend/app/bets/types/bet.types.ts

export interface BetDetails {
  id: number
  randomId?: string // Add optional random ID  
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
}

export type FilterType = 'all' | 'active' | 'pending' | 'resolved'