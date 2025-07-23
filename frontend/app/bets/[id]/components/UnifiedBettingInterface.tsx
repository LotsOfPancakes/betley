// frontend/app/bets/[id]/components/UnifiedBettingInterface.tsx
// REFACTORED: Clean, focused component using extracted utilities and sub-components
'use client'

import { useEffect } from 'react'
import { 
  canUserBet, 
  getUserExistingOptionIndex
} from '@/lib/utils/bettingUtils'

// Import our extracted components
import { BetStatusHeader } from './BetStatusHeader'
import { BetOptionsGrid } from './BetOptionsGrid'
import { BetAmountInput } from './BetAmountInput'

interface UnifiedBettingInterfaceProps {
  // Bet Info props
  name: string
  isActive: boolean
  resolved: boolean
  winningOption?: number
  timeLeft: number
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
  
  // Betting Interface props
  address?: string
  options?: readonly string[]
  userBets?: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  betAmount: string
  setBetAmount: (amount: string) => void
  needsApproval: boolean
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  totalAmounts?: readonly bigint[]
  decimals?: number
  hypeBalance?: bigint
  justPlacedBet?: boolean
  hasExistingBet?: boolean
  isNativeBet?: boolean
}

export function UnifiedBettingInterface({
  // Bet info
  name,
  isActive,
  resolved,
  winningOption,
  timeLeft,
  resolutionTimeLeft,
  resolutionDeadlinePassed,
  
  // Betting interface
  address,
  options,
  userBets,
  selectedOption,
  setSelectedOption,
  betAmount,
  setBetAmount,
  needsApproval,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  totalAmounts,
  decimals,
  hypeBalance,
  //justPlacedBet, // Currently unused
  hasExistingBet,
  isNativeBet = false
}: UnifiedBettingInterfaceProps) {

  // ============================================================================
  // BUSINESS LOGIC - Centralized calculations
  // ============================================================================
  
  // Safe defaults for required props
  const safeOptions = options || []
  const safeUserBets = userBets || []
  const safeTotalAmounts = totalAmounts || []
  const safeDecimals = decimals || 18
  const safeBalance = hypeBalance || BigInt(0)

  // Calculate totals and user state
  const totalPool = safeTotalAmounts.reduce((a, b) => a + b, BigInt(0))
  const userExistingOptionIndex = getUserExistingOptionIndex(safeUserBets)
  const canBet = canUserBet(address, isActive, resolved)

  // ============================================================================
  // SIDE EFFECTS - Auto-selection logic
  // ============================================================================
  
  // Auto-select the option user has already bet on
  useEffect(() => {
    const safeHasExistingBet = hasExistingBet || false
    if (safeHasExistingBet && userExistingOptionIndex !== -1 && selectedOption !== userExistingOptionIndex) {
      setSelectedOption(userExistingOptionIndex)
    }
  }, [hasExistingBet, userExistingOptionIndex, selectedOption, setSelectedOption])

  // ============================================================================
  // RENDER - Clean component composition
  // ============================================================================
  
  return (
    <div className="space-y-6">
      {/* Header Section - Status, title, share */}
      <BetStatusHeader
        name={name}
        isActive={isActive}
        resolved={resolved}
        resolutionDeadlinePassed={resolutionDeadlinePassed}
        timeLeft={timeLeft}
        resolutionTimeLeft={resolutionTimeLeft}
        totalPool={totalPool}
        decimals={safeDecimals}
        isNativeBet={isNativeBet}
      />

      {/* Options Grid - Betting options selection */}
      <BetOptionsGrid
        address={address}
        options={safeOptions}
        userBets={safeUserBets}
        totalAmounts={safeTotalAmounts}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        canBet={canBet}
        hasExistingBet={hasExistingBet || false}
        resolved={resolved}
        winningOption={winningOption}
        decimals={safeDecimals}
        isNativeBet={isNativeBet}
      />

      {/* Amount Input - Only show if user can bet */}
      {canBet && (
        <BetAmountInput
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={safeBalance}
          decimals={safeDecimals}
          isNativeBet={isNativeBet}
          hasExistingBet={hasExistingBet || false}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isPending={isPending}
          handleApprove={handleApprove}
          handlePlaceBet={handlePlaceBet}
          selectedOption={selectedOption}
          options={safeOptions}
        />
      )}
    </div>
  )
}