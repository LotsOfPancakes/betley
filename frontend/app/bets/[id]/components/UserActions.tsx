// frontend/app/bets/[id]/components/UserActions.tsx
'use client'

import { formatUnits } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { useNotification } from '@/lib/hooks/useNotification'
import { useBetFeeData, type FeeBreakdown } from '../hooks/useBetFeeData'
import { getTokenConfig, ZERO_ADDRESS } from '@/lib/tokenUtils'
import { 
  calculateWinningsBreakdown, 
  calculateUserTotalBet,
  hasUserWon,
  type WinningsBreakdown,
} from '@/lib/utils'
import { hasRefundableBets, isBetEmpty } from '@/lib/utils/bettingUtils'
import { config } from '@/lib/config'


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
  hasClaimedCreatorFees?: boolean // NEW: Add creator fee claim status
  decimals?: number
  isPending: boolean
  handleClaimWinnings: () => void
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
  | { type: 'user-lost'; amount: bigint }

// ============================================================================
// UTILITY FUNCTIONS - Pure functions, easily testable
// ============================================================================

/**
 * Get token symbol using existing utility
 * @param isNativeBet - Whether this is a native HYPE bet
 * @returns Token symbol string
 */
// const getTokenSymbol = (tokenAddress?: string, isNativeBet?: boolean): string => {
//   if (tokenAddress) {
//     return getTokenConfig(tokenAddress).symbol
//   }
//   // Fallback to isNativeBet if tokenAddress is not available
//   return getTokenConfig(isNativeBet ? ZERO_ADDRESS : config.contracts.mockERC20).symbol
// }

/**
 * Format amount with token symbol consistently
 * @param amount - Amount in wei
 * @param decimals - Token decimals
 * @param isNativeBet - Whether this is native HYPE
 * @returns Formatted string with amount and symbol
 */
const formatTokenAmount = (amount: bigint, decimals: number, isNativeBet: boolean): string => 
  `${formatUnits(amount, decimals)} ${getTokenConfig(isNativeBet ? ZERO_ADDRESS : config.contracts.mockERC20).symbol}`

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
    const claimType = userWon ? 'winnings' : (isCreator ? 'creator fees' : 'refund')
    
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
  hasClaimedCreatorFees, // NEW: Accept creator fee claim status
  decimals = 18,
  isPending,
  handleClaimWinnings,
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
    feeParams,
    error: feeDataError
  } = useBetFeeData(betId, address, totalAmounts, winningOption, resolved)

  const { showError, showSuccess } = useNotification()
  
  const { 
    writeContract: writeCreatorClaim, 
    isPending: isCreatorClaimPending,
    data: creatorClaimTxHash
  } = useWriteContract()

  const { isSuccess: isCreatorClaimSuccess } = useWaitForTransactionReceipt({ 
    hash: creatorClaimTxHash 
  })

  // State for creator fee breakdown
  const [isCreatorFeeExpanded, setIsCreatorFeeExpanded] = useState(false)

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
      isCreator,
      winningsBreakdown,
      totalAmounts
    ),
    [userBets, resolved, winningOption, resolutionDeadlinePassed, hasClaimed, isCreator, winningsBreakdown, totalAmounts]
  )

  // Use the fee data from winnings breakdown if available, fallback to calculated
  const actualCreatorFeeAmount = winningsBreakdown?.creatorFee ?? creatorFeeAmount
  const hasCreatorFees = isCreator && actualCreatorFeeAmount && actualCreatorFeeAmount > BigInt(0)

  // ============================================================================
  // EFFECTS - Properly isolated side effects
  // ============================================================================
  
  useEffect(() => {
    if (isCreatorClaimSuccess) {
      showSuccess('Creator fees claimed successfully!')
    }
  }, [isCreatorClaimSuccess, showSuccess])

  useEffect(() => {
    if (feeDataError) {
      console.error('Fee data error:', feeDataError)
    }
  }, [feeDataError])

  // ============================================================================
  // EVENT HANDLERS - Clear, single responsibility
  // ============================================================================
  
  const handleClaimCreatorFees = useCallback(async () => {
    if (!betId || isCreatorClaimPending) return
    
    try {
      await writeCreatorClaim({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimCreatorFees',
        args: [BigInt(betId)],
      })
    } catch (error) {
      console.error('Error claiming creator fees:', error)
      showError('Failed to claim creator fees. Please try again.')
    }
  }, [betId, isCreatorClaimPending, writeCreatorClaim, showError])

  // ============================================================================
  // RENDER - Clean JSX with clear structure
  // ============================================================================
  
  // Check if this is an empty expired bet
  const isEmptyExpiredBet = resolutionDeadlinePassed && !resolved && totalAmounts && isBetEmpty(totalAmounts)
  
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
      
      {/* Main Claim Status Section */}
      {!isEmptyExpiredBet && (() => {
        switch (claimStatus.type) {
          case 'already-claimed':
            return (
              <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-blue-300">
                  You have already claimed {claimStatus.claimType}
                  {claimStatus.amount && (
                    <span>
                      {' '}of {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)}
                    </span>
                  )}
                </p>
              </div>
            )

          case 'can-claim-winnings':
            return (
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-green-300 mb-4">
                  🎉 Congratulations! You won {formatTokenAmount(claimStatus.breakdown.totalWinnings, decimals, isNativeBet)}
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
              </div>
            )

          case 'can-claim-refund':
            return (
              <div className="bg-gradient-to-br from-orange-900/40 to-yellow-900/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-orange-300 mb-4">
                  The bet resolution deadline has passed without resolution.
                  You can claim a refund.
                </p>
                <p className="text-sm text-orange-200 mb-3">
                  Your total bet: {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)}
                </p>
                <ClaimButton
                  onClick={handleClaimWinnings}
                  disabled={isPending}
                  variant="info"
                >
                  {isPending ? 'Claiming Refund...' : 'Claim Refund'}
                </ClaimButton>
              </div>
            )

          case 'user-lost':
            return !isCreator ? (
              <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-red-300">
                  You lost {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)} this bet. Better luck next time!
                </p>
              </div>
            ) : null

          default:
            return null
        }
      })()}

      {/* Creator Fee Section - only show if not empty expired bet */}
      {!isEmptyExpiredBet && hasCreatorFees && !hasClaimedCreatorFees ? (
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm rounded-3xl p-6">
          <p className="text-yellow-300 mb-4">
            Creator Fees available: {formatTokenAmount(actualCreatorFeeAmount, decimals, isNativeBet)}
          </p>
          
          <ClaimButton
            onClick={handleClaimCreatorFees}
            disabled={isCreatorClaimPending}
            variant="warning"
          >
            {isCreatorClaimPending ? 'Claiming...' : `Claim ${formatTokenAmount(actualCreatorFeeAmount, decimals, isNativeBet)} Creator Fees`}
          </ClaimButton>

          {/* Clean Creator Fee Breakdown */}
          <div className="bg-gradient-to-br from-yellow-800/30 to-orange-800/30 rounded-2xl p-4 mt-4">
            <button
              onClick={() => setIsCreatorFeeExpanded(!isCreatorFeeExpanded)}
              className="w-full flex items-center justify-between text-yellow-200 hover:text-yellow-400 transition-colors"
              aria-expanded={isCreatorFeeExpanded}
              aria-controls="creator-fee-details"
            >
              <span className="font-semibold">Fee Breakdown</span>
              <span className={`transform transition-transform ${isCreatorFeeExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {isCreatorFeeExpanded && (
              <div id="creator-fee-details" className="mt-3 space-y-2 text-yellow-200 text-sm">
                <div className="flex justify-between">
                  <span>Losing Pool Total:</span>
                  <span>{formatTokenAmount(
                    winningsBreakdown ? 
                      winningsBreakdown.rawWinningsFromLosers + winningsBreakdown.creatorFee + winningsBreakdown.platformFee :
                      BigInt(0), 
                    decimals, 
                    isNativeBet
                  )}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                  <span>Creator Fee (1%):</span>
                  <span className="text-yellow-400">{formatTokenAmount(actualCreatorFeeAmount, decimals, isNativeBet)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}