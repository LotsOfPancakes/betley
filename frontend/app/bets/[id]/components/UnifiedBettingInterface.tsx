// frontend/app/bets/[id]/components/UnifiedBettingInterface.tsx
'use client'

import { useEffect } from 'react'
import { 
  getUserExistingOptionIndex
} from '@/lib/utils/bettingUtils'
import { useBetFeeData } from '../hooks/useBetFeeData'

// Import our extracted components
import { BetStatusHeader } from './BetStatusHeader'
import { BetOptionsGrid } from './BetOptionsGrid'
import { BetAmountInput } from './BetAmountInput'
import { Timeline } from './Timeline'

interface UnifiedBettingInterfaceProps {
  // Bet Info props
  name: string
  isPublic?: boolean
  isActive: boolean
  resolved: boolean
  winningOption?: number
  timeLeft: number
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
  
  // Timeline props
  endTime?: bigint
  createdAt?: string
  
  // Betting Interface props  
  address?: string
  creator: string
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
  ethBalance?: bigint
  justPlacedBet?: boolean
  hasExistingBet?: boolean
  isNativeBet?: boolean
  betId: string // Added for fee data hook
  onResolveEarly: () => void
  onManageWhitelist: () => void
}

export function UnifiedBettingInterface({
  // Bet info
  name,
  isPublic = false,
  isActive,
  resolved,
  winningOption,
  timeLeft,
  resolutionTimeLeft,
  resolutionDeadlinePassed,
  
  // Timeline
  endTime,
  createdAt,
  
  // Betting interface
  betId,
  address,
  creator,
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
  ethBalance,
  //justPlacedBet, // Currently unused
  hasExistingBet,
  isNativeBet,
  onResolveEarly,
  onManageWhitelist
}: UnifiedBettingInterfaceProps) {

  // ============================================================================
  // BUSINESS LOGIC - Centralized calculations
  // ============================================================================
  
  // Safe defaults for required props
  const safeOptions = options || []
  const safeUserBets = userBets || []
  const safeTotalAmounts = totalAmounts || []
  const safeDecimals = decimals || 18
  const safeBalance = ethBalance || BigInt(0)

  // Calculate totals and user state
  const totalPool = safeTotalAmounts.reduce((a, b) => a + b, BigInt(0))
  const userExistingOptionIndex = getUserExistingOptionIndex(safeUserBets)

  // ============================================================================
  // HOOKS - Fee data for potential winnings calculation
  // ============================================================================
  
  // Fetch fee parameters for potential winnings preview
  // Only call if betId is numeric (not randomId string)
  const isNumericBetId = betId && /^\d+$/.test(betId)
  const { feeParams } = useBetFeeData(
    isNumericBetId ? betId : '', 
    address, 
    safeTotalAmounts, 
    winningOption, 
    resolved
  )

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
        isPublic={isPublic}
        isActive={isActive}
        resolved={resolved}
        resolutionDeadlinePassed={resolutionDeadlinePassed}
        timeLeft={timeLeft}
        resolutionTimeLeft={resolutionTimeLeft}
        totalPool={totalPool}
        decimals={safeDecimals} 
        isNativeBet={isNativeBet || false}
        address={address}
        creator={creator}
        onResolveEarly={onResolveEarly}
        onManageWhitelist={onManageWhitelist}
      />

      {/* 2-Column Layout: Options (60%) + Amount Input (40%) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Betting Options (60% on desktop) */}
        <div className="flex-1 lg:w-[60%]">
          <BetOptionsGrid
            options={safeOptions}
            userBets={safeUserBets}
            totalAmounts={safeTotalAmounts}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            hasExistingBet={hasExistingBet || false}
            resolved={resolved}
            winningOption={winningOption}
            decimals={safeDecimals}
            isNativeBet={isNativeBet || false}
          />
        </div>

        {/* Right Column - Amount Input (40% on desktop) */}
        <div className="lg:w-[40%] lg:min-w-[320px]">
          <BetAmountInput
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            balance={safeBalance}
            decimals={safeDecimals}
            isNativeBet={isNativeBet || false}
            hasExistingBet={hasExistingBet || false}
            needsApproval={needsApproval}
            isApproving={isApproving}
            isPending={isPending}
            handleApprove={handleApprove}
            handlePlaceBet={handlePlaceBet}
            selectedOption={selectedOption}
            options={safeOptions}
            totalAmounts={safeTotalAmounts}
            feeParams={feeParams}
            address={address}
            isActive={isActive}
            resolved={resolved}
            betId={betId}
          />
        </div>
      </div>

      {/* Timeline Component - Below the betting interface */}
      <Timeline
        endTime={endTime}
        createdAt={createdAt}
        resolved={resolved}
      />
    </div>
  )
}