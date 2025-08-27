// frontend/app/bets/[id]/components/UserActions.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'

import { useBetFeeData, type FeeBreakdown } from '../hooks/useBetFeeData'
import { 
  calculateWinningsBreakdown, 
  calculateUserTotalBet,
  hasUserWon,
  type WinningsBreakdown,
} from '@/lib/utils'
import { hasRefundableBets, isBetEmpty } from '@/lib/utils/bettingUtils'
import { formatTokenAmount } from '@/lib/utils/tokenFormatting'


// ============================================================================
// TYPES & INTERFACES - Clear separation of concerns
// ============================================================================

interface UserActionsProps {
  address?: string
  resolved: boolean
  winningOption?: number
  userBets?: readonly bigint[]
  totalAmounts?: readonly bigint[]
  resolutionDeadlinePassed: boolean
  hasClaimed?: boolean
  hasClaimedCreatorFees?: boolean

  decimals?: number
  isPending: boolean
  handleClaimWinnings: () => void
  handleClaimRefund: () => void
  handleClaimCreatorFees: () => void
  betId: string
  isNativeBet?: boolean
  tokenAddress?: string  // ADD THIS LINE
  creator?: string
}

interface CollapsibleDetailsProps {
  data: WinningsBreakdown | FeeBreakdown
  type: 'winnings' | 'fees'
  decimals: number
  isNativeBet: boolean
}

type ClaimStatus = 
  | { type: 'none' }
  | { type: 'already-claimed'; claimType: string; amount?: bigint }
  | { type: 'can-claim-winnings'; breakdown: WinningsBreakdown }
  | { type: 'can-claim-refund'; amount: bigint }
  | { type: 'can-claim-creator-fees'; amount?: bigint }
  | { type: 'user-lost'; amount: bigint }

// ============================================================================
// UTILITY FUNCTIONS - Pure functions, easily testable
// ============================================================================

/**
 * Check if creator can claim fees
 * NOTE: Updated to use fee data from useBetFeeData instead of winningsBreakdown
 * This allows creator fees to work regardless of whether creator won/lost personal bets
 */
const canClaimCreatorFees = (
  resolved: boolean,
  winningOption: number | undefined,
  isCreator: boolean,
  hasClaimedCreatorFees: boolean,
  creatorFeeAmount: bigint
): boolean => {
  return Boolean(resolved && 
         winningOption !== undefined && 
         isCreator && 
         !hasClaimedCreatorFees && 
         creatorFeeAmount > BigInt(0))
}

/**
 * Determine user's claim status based on bet state
 * @param userBets - User's bet amounts
 * @param resolved - Whether bet is resolved
 * @param winningOption - Winning option index
 * @param resolutionDeadlinePassed - Whether deadline passed
 * @param hasClaimed - Whether user already claimed
 * @param isCreator - Whether user is the bet creator
 * @param breakdown - Winnings breakdown if available
 * @param totalAmounts - Total amounts per option (to check if bet is empty)
 * @returns Structured claim status
 */
const determineClaimStatus = (
  userBets: readonly bigint[],
  resolved: boolean,
  winningOption: number | undefined,
  resolutionDeadlinePassed: boolean,
  hasClaimed: boolean,
  hasClaimedCreatorFees: boolean,
  isCreator: boolean,
  breakdown: WinningsBreakdown | null,
  totalAmounts?: readonly bigint[]
): ClaimStatus => {
  const totalBet = calculateUserTotalBet(userBets)
  
  if (totalBet === BigInt(0)) {
    return { type: 'none' }
  }

  if (hasClaimed) {
    const userWon = resolved && winningOption !== undefined && hasUserWon(userBets, winningOption)
    
    // Determine claim type with proper priority
    let claimType: string
    if (!resolved && resolutionDeadlinePassed) {
      // Unresolved bet past deadline = refund (regardless of creator status)
      claimType = 'refund'
    } else if (userWon) {
      // Resolved bet + user won = winnings
      claimType = 'winnings'
    } else if (isCreator) {
      // Creator claiming fees on resolved bet
      claimType = 'creator fees'
    } else {
      // Fallback for other scenarios
      claimType = 'refund'
    }
    
    // For refunds, use totalBet; for winnings, use breakdown amount
    let amount: bigint | undefined
    if (claimType === 'refund') {
      amount = totalBet
    } else if (claimType === 'winnings') {
      amount = breakdown?.totalWinnings
    } else {
      // creator fees - could add logic here if needed
      amount = breakdown?.totalWinnings
    }
    
    return { 
      type: 'already-claimed', 
      claimType,
      amount
    }
  }

  if (resolved && winningOption !== undefined) {
    if (hasUserWon(userBets, winningOption) && breakdown) {
      return { type: 'can-claim-winnings', breakdown }
    }
    return { type: 'user-lost', amount: totalBet }
  }

  if (resolutionDeadlinePassed && !resolved) {
    // Only show refund if user has refundable bets AND bet is not empty
    if (hasRefundableBets(userBets) && totalAmounts && !isBetEmpty(totalAmounts)) {
      return { type: 'can-claim-refund', amount: totalBet }
    }
  }

  return { type: 'none' }
}

// ============================================================================
// UI COMPONENTS - Single responsibility, reusable
// ============================================================================

/**
 * Reusable collapsible details component
 * Handles both winnings and fee breakdowns with proper theming
 */
function CollapsibleDetails({ data, type, decimals, isNativeBet }: CollapsibleDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Theme configuration based on type
  const theme = type === 'winnings' 
    ? { bg: 'from-green-800/30 to-emerald-800/30', text: 'text-green-200', accent: 'text-green-400' }
    : { bg: 'from-yellow-800/30 to-orange-800/30', text: 'text-yellow-200', accent: 'text-yellow-400' }

  if (!data) return null

  return (
    <div className={`bg-gradient-to-br ${theme.bg} rounded-2xl p-4 mt-4`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${theme.text} hover:${theme.accent} transition-colors`}
        aria-expanded={isExpanded}
        aria-controls={`${type}-details`}
      >
        <span className="font-semibold">
          {type === 'winnings' ? 'Winnings Breakdown' : 'Fee Breakdown'}
        </span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div id={`${type}-details`} className={`mt-3 space-y-2 ${theme.text} text-sm`}>
          {type === 'winnings' ? (
            <>
              <div className="flex justify-between">
                <span>Your Bet:</span>
                <span>{formatTokenAmount((data as WinningsBreakdown).originalBet, decimals, isNativeBet)}</span>
              </div>
              <div className="flex justify-between">
                <span>Share of Losing Pool:</span>
                <span>{formatTokenAmount((data as WinningsBreakdown).rawWinningsFromLosers, decimals, isNativeBet)}</span>
              </div>
              
              {/* NEW: Show fee deductions in red if they exist */}
              {(data as WinningsBreakdown).creatorFee > BigInt(0) && (
                <div className="flex justify-between text-red-300">
                  <span>Creator Fee (1%):</span>
                  <span>-{formatTokenAmount((data as WinningsBreakdown).creatorFee, decimals, isNativeBet)}</span>
                </div>
              )}
              {(data as WinningsBreakdown).platformFee > BigInt(0) && (
                <div className="flex justify-between text-red-300">
                  <span>Platform Fee (0.5%):</span>
                  <span>-{formatTokenAmount((data as WinningsBreakdown).platformFee, decimals, isNativeBet)}</span>
                </div>
              )}
        
        <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
          <span>Total Winnings:</span>
          <span className={theme.accent}>{formatTokenAmount((data as WinningsBreakdown).totalWinnings, decimals, isNativeBet)}</span>
        </div>
      </>
    ) : (
            <>
              <div className="flex justify-between">
                <span>Losing Pool:</span>
                <span>{formatTokenAmount((data as FeeBreakdown).losingPool, decimals, isNativeBet)}</span>
              </div>
              <div className="flex justify-between">
                <span>Creator Fee:</span>
                <span>{formatTokenAmount((data as FeeBreakdown).creatorFee, decimals, isNativeBet)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span>{formatTokenAmount((data as FeeBreakdown).platformFee, decimals, isNativeBet)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                <span>Total Fees:</span>
                <span className={theme.accent}>{formatTokenAmount((data as FeeBreakdown).totalFees, decimals, isNativeBet)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Reusable status card wrapper with consistent styling
 */
function StatusCard({ 
  variant, 
  children, 
  className = "" 
}: {
  variant: 'success' | 'warning' | 'info' | 'error' | 'neutral'
  children: React.ReactNode
  className?: string
}) {
  const variants = {
    success: 'from-green-900/40 to-emerald-900/40',
    warning: 'from-yellow-900/40 to-orange-900/40', 
    info: 'from-orange-900/40 to-yellow-900/40',
    error: 'from-red-900/40 to-red-800/40',
    neutral: 'from-blue-900/40 to-indigo-900/40'
  }

  return (
    <div className={`bg-gradient-to-br ${variants[variant]} backdrop-blur-sm rounded-3xl p-6 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Reusable claim button with consistent styling and variants
 */
function ClaimButton({ 
  onClick, 
  disabled, 
  variant, 
  children 
}: {
  onClick: () => void
  disabled: boolean
  variant: 'success' | 'warning' | 'info'
  children: React.ReactNode
}) {
  const variantStyles = {
    success: 'from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-green-500/30',
    warning: 'from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 shadow-yellow-500/30',
    info: 'from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 shadow-orange-500/30'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-gradient-to-r ${variantStyles[variant]} disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl disabled:shadow-none`}
    >
      {children}
    </button>
  )
}

// ============================================================================
// STATUS COMPONENTS - Extracted from switch statement
// ============================================================================

/**
 * Component for displaying already claimed status
 */
function AlreadyClaimedStatus({ 
  claimStatus, 
  decimals, 
  isNativeBet 
}: {
  claimStatus: Extract<ClaimStatus, { type: 'already-claimed' }>
  decimals: number
  isNativeBet: boolean
}) {
  return (
    <StatusCard variant="neutral">
      <p className="text-blue-300">
        You have claimed {claimStatus.claimType}
        {claimStatus.amount && (
          <span>
            {' '}of {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)}
          </span>
        )}
      </p>
    </StatusCard>
  )
}

/**
 * Component for claiming winnings
 */
function WinningsClaimable({ 
  claimStatus, 
  handleClaimWinnings, 
  isPending, 
  decimals, 
  isNativeBet 
}: {
  claimStatus: Extract<ClaimStatus, { type: 'can-claim-winnings' }>
  handleClaimWinnings: () => void
  isPending: boolean
  decimals: number
  isNativeBet: boolean
}) {
  return (
    <StatusCard variant="success">
      <p className="text-green-300 mb-4">
      Congratulations on winning!
      </p>
      
      <ClaimButton
        onClick={handleClaimWinnings}
        disabled={isPending}
        variant="success"
      >
        {isPending ? 'Claiming...' : `Claim ${formatTokenAmount(claimStatus.breakdown.totalWinnings, decimals, isNativeBet)} Winnings`}
      </ClaimButton>

      <CollapsibleDetails
        data={claimStatus.breakdown}
        type="winnings"
        decimals={decimals}
        isNativeBet={isNativeBet}
      />
    </StatusCard>
  )
}

/**
 * Component for claiming refunds
 */
function RefundClaimable({ 
  claimStatus, 
  handleClaimRefund, 
  isPending, 
  decimals, 
  isNativeBet 
}: {
  claimStatus: Extract<ClaimStatus, { type: 'can-claim-refund' }>
  handleClaimRefund: () => void
  isPending: boolean
  decimals: number
  isNativeBet: boolean
}) {
  return (
    <StatusCard variant="info">
      <p className="text-orange-300 mb-4">
        The bet resolution deadline has passed without resolution.
        You can claim a refund.
      </p>
      <p className="text-sm text-orange-200 mb-3">
        Your total bet: {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)}
      </p>
      <ClaimButton
        onClick={handleClaimRefund}
        disabled={isPending}
        variant="info"
      >
        {isPending ? 'Claiming Refund...' : 'Claim Refund'}
      </ClaimButton>
    </StatusCard>
  )
}

/**
 * Component for claiming creator fees
 */
function CreatorFeesClaimable({ 
  claimStatus, 
  handleClaimCreatorFees, 
  isPending, 
  decimals, 
  isNativeBet 
}: {
  claimStatus: Extract<ClaimStatus, { type: 'can-claim-creator-fees' }>
  handleClaimCreatorFees: () => void
  isPending: boolean
  decimals: number
  isNativeBet: boolean
}) {
  return (
    <StatusCard variant="warning">
      <p className="text-orange-300 mb-4">
      Creator fees available! You earned {claimStatus.amount ? formatTokenAmount(claimStatus.amount, decimals, isNativeBet) : '...'} from this bet.
      </p>
      
      <ClaimButton
        onClick={handleClaimCreatorFees}
        disabled={isPending}
        variant="warning"
      >
        {isPending ? 'Claiming...' : `Claim ${claimStatus.amount ? formatTokenAmount(claimStatus.amount, decimals, isNativeBet) : '...'} Creator Fees`}
      </ClaimButton>
    </StatusCard>
  )
}

/**
 * Component for showing already claimed creator fees
 */
function CreatorFeesClaimedStatus({ 
  amount, 
  decimals, 
  isNativeBet 
}: {
  amount: bigint
  decimals: number
  isNativeBet: boolean
}) {
  return (
    <StatusCard variant="neutral">
      <p className="text-blue-300">
        You have claimed creator fees of {formatTokenAmount(amount, decimals, isNativeBet)}
      </p>
    </StatusCard>
  )
}

/**
 * Component for displaying user lost status
 */
function UserLostStatus({ 
  claimStatus, 
  decimals, 
  isNativeBet,
//  isCreator 
}: {
  claimStatus: Extract<ClaimStatus, { type: 'user-lost' }>
  decimals: number
  isNativeBet: boolean
//  isCreator: boolean
}) {
  return (
    <StatusCard variant="error">
      <p className="text-red-300">
        You lost {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)} this bet. Better luck next time!
      </p>
    </StatusCard>
  )
}

// ============================================================================
// MAIN COMPONENT - Clean, focused on orchestration
// ============================================================================

export function UserActions({
  address,
  resolved,
  winningOption,
  userBets,
  totalAmounts,
  resolutionDeadlinePassed,
  hasClaimed,
  hasClaimedCreatorFees,

  decimals = 18,
  isPending,
  handleClaimWinnings,
  handleClaimRefund,
  handleClaimCreatorFees,
  betId,
  isNativeBet = false,
  creator
}: UserActionsProps) {

  // ============================================================================
  // HOOKS & STATE - Grouped logically
  // ============================================================================
  
  const {
    contractWinnings,
    creatorFeeAmount,
    platformFeeAmount,
    feeParams,
    error: feeDataError
  } = useBetFeeData(betId, address, totalAmounts, winningOption, resolved)

  




  // ============================================================================
  // COMPUTED VALUES - Derived state, well-named
  // ============================================================================
  
  const isCreator = Boolean(address && creator && address.toLowerCase() === creator.toLowerCase())
  
  const winningsBreakdown = useMemo((): WinningsBreakdown | null => {
    if (!resolved || !userBets || winningOption === undefined || !totalAmounts || !feeParams) {
      return null
    }

    return calculateWinningsBreakdown({
      userBets,
      totalAmounts,
      winningOption,
      feeParams,
      contractWinnings,
      resolved
    })
  }, [resolved, userBets, winningOption, totalAmounts, feeParams, contractWinnings])

  const claimStatus = useMemo(() => 
    determineClaimStatus(
      userBets || [],
      resolved,
      winningOption,
      resolutionDeadlinePassed,
      hasClaimed || false,
      hasClaimedCreatorFees || false,
      isCreator,
      winningsBreakdown,
      totalAmounts
    ),
    [userBets, resolved, winningOption, resolutionDeadlinePassed, hasClaimed, hasClaimedCreatorFees, isCreator, winningsBreakdown, totalAmounts]
  )

  // Use the fee data from winnings breakdown if available, fallback to calculated



  // ============================================================================
  // EFFECTS - Properly isolated side effects
  // ============================================================================
  


  useEffect(() => {
    if (feeDataError) {
      console.error('Fee data error:', feeDataError)
    }
  }, [feeDataError])

  // ============================================================================
  // EVENT HANDLERS - Clear, single responsibility
  // ============================================================================
  


  // ============================================================================
  // RENDER - Clean JSX with clear structure
  // ============================================================================
  
  // Check if this is an empty expired bet
  const isEmptyExpiredBet = resolutionDeadlinePassed && !resolved && totalAmounts && isBetEmpty(totalAmounts)
  
  // Check if creator can claim fees (independent of regular winnings)
  // Use fee data from useBetFeeData hook instead of winningsBreakdown for creator fees
  const showCreatorFees = canClaimCreatorFees(resolved, winningOption, isCreator, hasClaimedCreatorFees || false, creatorFeeAmount)
  
  // Check if creator has already claimed fees
  // Use fee data from useBetFeeData hook instead of winningsBreakdown
  const showCreatorFeesClaimed = resolved && winningOption !== undefined && isCreator && (hasClaimedCreatorFees || false) && creatorFeeAmount > BigInt(0)
  
  return (
    <div className="space-y-4">
      {/* Special case: Empty expired bet */}
      {isEmptyExpiredBet && (
        <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm rounded-3xl p-6">
          <p className="text-gray-400">
            This bet expired without any participants. No action needed.
          </p>
        </div>
      )}
      
      {/* Creator Fees Section - Independent of main claim status */}
      {/* NOTE: Now uses fee data from useBetFeeData instead of winningsBreakdown */}
      {showCreatorFees && (
        <CreatorFeesClaimable
          claimStatus={{ type: 'can-claim-creator-fees', amount: creatorFeeAmount }}
          handleClaimCreatorFees={handleClaimCreatorFees}
          isPending={isPending}
          decimals={decimals}
          isNativeBet={isNativeBet}
        />
      )}
      
      {/* Creator Fees Already Claimed Section */}
      {/* NOTE: Now uses fee data from useBetFeeData instead of winningsBreakdown */}
      {showCreatorFeesClaimed && (
        <CreatorFeesClaimedStatus
          amount={creatorFeeAmount}
          decimals={decimals}
          isNativeBet={isNativeBet}
        />
      )}
      
      {/* Main Claim Status Section */}
      {!isEmptyExpiredBet && (() => {
        switch (claimStatus.type) {
          case 'already-claimed':
            return (
              <AlreadyClaimedStatus
                claimStatus={claimStatus}
                decimals={decimals}
                isNativeBet={isNativeBet}
              />
            )

          case 'can-claim-winnings':
            return (
              <WinningsClaimable
                claimStatus={claimStatus}
                handleClaimWinnings={handleClaimWinnings}
                isPending={isPending}
                decimals={decimals}
                isNativeBet={isNativeBet}
              />
            )

          case 'can-claim-refund':
            return (
              <RefundClaimable
                claimStatus={claimStatus}
                handleClaimRefund={handleClaimRefund}
                isPending={isPending}
                decimals={decimals}
                isNativeBet={isNativeBet}
              />
            )

          case 'user-lost':
            return (
              <UserLostStatus
                claimStatus={claimStatus}
                decimals={decimals}
                isNativeBet={isNativeBet}
              // isCreator={isCreator}
              />
            )

          default:
            return null
        }
      })()}


    </div>
  )
}