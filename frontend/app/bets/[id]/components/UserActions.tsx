// frontend/app/bets/[id]/components/UserActions.tsx - BEST PRACTICES REFACTORING
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
  decimals?: number
  isPending: boolean
  handleClaimWinnings: () => void
  betId: string
  isNativeBet?: boolean
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
const getTokenSymbol = (isNativeBet: boolean): string => 
  getTokenConfig(isNativeBet ? ZERO_ADDRESS : '').symbol

/**
 * Format amount with token symbol consistently
 * @param amount - Amount in wei
 * @param decimals - Token decimals
 * @param isNativeBet - Whether this is native HYPE
 * @returns Formatted string with amount and symbol
 */
const formatTokenAmount = (amount: bigint, decimals: number, isNativeBet: boolean): string => 
  `${formatUnits(amount, decimals)} ${getTokenSymbol(isNativeBet)}`

/**
 * Determine user's claim status based on bet state
 * @param userBets - User's bet amounts
 * @param resolved - Whether bet is resolved
 * @param winningOption - Winning option index
 * @param resolutionDeadlinePassed - Whether deadline passed
 * @param hasClaimed - Whether user already claimed
 * @param isCreator - Whether user is the bet creator
 * @param breakdown - Winnings breakdown if available
 * @returns Structured claim status
 */
const determineClaimStatus = (
  userBets: readonly bigint[],
  resolved: boolean,
  winningOption: number | undefined,
  resolutionDeadlinePassed: boolean,
  hasClaimed: boolean,
  isCreator: boolean,
  breakdown: WinningsBreakdown | null
): ClaimStatus => {
  const totalBet = calculateUserTotalBet(userBets)
  
  if (totalBet === BigInt(0)) {
    return { type: 'none' }
  }

  if (hasClaimed) {
    const userWon = resolved && winningOption !== undefined && hasUserWon(userBets, winningOption)
    const claimType = userWon ? 'winnings' : (isCreator ? 'creator fees' : 'refund')
    return { 
      type: 'already-claimed', 
      claimType,
      amount: breakdown?.totalWinnings 
    }
  }

  if (resolved && winningOption !== undefined) {
    if (hasUserWon(userBets, winningOption) && breakdown) {
      return { type: 'can-claim-winnings', breakdown }
    }
    return { type: 'user-lost', amount: totalBet }
  }

  if (resolutionDeadlinePassed && !resolved) {
    return { type: 'can-claim-refund', amount: totalBet }
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
    ? {
        borderColor: 'border-green-600/30',
        textColor: 'text-green-300 hover:text-green-200',
        contentColor: 'text-green-200',
        accentColor: 'text-green-100'
      }
    : {
        borderColor: 'border-yellow-600/30', 
        textColor: 'text-yellow-300 hover:text-yellow-200',
        contentColor: 'text-gray-300',
        accentColor: 'text-yellow-400'
      }

  return (
    <div className={`border-t ${theme.borderColor} pt-3`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${theme.textColor} transition-colors text-sm`}
        aria-expanded={isExpanded}
        aria-controls={`breakdown-${type}`}
      >
        <span>View breakdown</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div 
          id={`breakdown-${type}`}
          className="mt-3 text-sm space-y-2 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-1">
            {type === 'winnings' ? (
              <WinningsBreakdownContent 
                breakdown={data as WinningsBreakdown}
                decimals={decimals}
                tokenSymbol={getTokenSymbol(isNativeBet)}
                theme={theme}
              />
            ) : (
              <FeeBreakdownContent 
                feeBreakdown={data as FeeBreakdown}
                decimals={decimals}
                tokenSymbol={getTokenSymbol(isNativeBet)}
                theme={theme}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Winnings breakdown content component
 */
function WinningsBreakdownContent({ 
  breakdown, 
  decimals, 
  tokenSymbol, 
  theme 
}: {
  breakdown: WinningsBreakdown
  decimals: number
  tokenSymbol: string
  theme: {
    borderColor: string
    contentColor: string
    accentColor: string
  }
}) {
  return (
    <>
      <p className={theme.contentColor}>
        Your original bet: {formatUnits(breakdown.originalBet, decimals)} {tokenSymbol}
      </p>
      {breakdown.rawWinningsFromLosers > BigInt(0) && (
        <p className={theme.contentColor}>
          Winnings from other bets: +{formatUnits(breakdown.rawWinningsFromLosers, decimals)} {tokenSymbol}
        </p>
      )}
      {breakdown.showFees && (
        <>
          <p className="text-red-400">
            Creator Fee (1%): -{formatUnits(breakdown.creatorFee, decimals)} {tokenSymbol}
          </p>
          <p className="text-red-400">
            Platform Fee (0.5%): -{formatUnits(breakdown.platformFee, decimals)} {tokenSymbol}
          </p>
        </>
      )}
      <div className={`border-t ${theme.borderColor} pt-2 mt-2`}>
        <p className={`font-semibold ${theme.accentColor}`}>
          Total winnings: {formatUnits(breakdown.totalWinnings, decimals)} {tokenSymbol}
        </p>
      </div>
    </>
  )
}

/**
 * Fee breakdown content component
 */
function FeeBreakdownContent({ 
  feeBreakdown, 
  decimals, 
  tokenSymbol, 
  theme 
}: {
  feeBreakdown: FeeBreakdown
  decimals: number
  tokenSymbol: string
  theme: {
    contentColor: string
    accentColor: string
  }
}) {
  return (
    <>
      <p className={theme.contentColor}>
        Losing Pool: {formatUnits(feeBreakdown.losingPool, decimals)} {tokenSymbol}
      </p>
      <p className={theme.accentColor}>
        Creator Fee (1%): -{formatUnits(feeBreakdown.creatorFee, decimals)} {tokenSymbol}
      </p>
      <p className={theme.contentColor}>
        Platform Fee (0.5%): -{formatUnits(feeBreakdown.platformFee, decimals)} {tokenSymbol}
      </p>
    </>
  )
}

/**
 * Standardized claim button component
 */
function ClaimButton({
  onClick,
  disabled,
  variant = 'success',
  children
}: {
  onClick: () => void
  disabled: boolean
  variant?: 'success' | 'warning' | 'info'
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
    feeBreakdown,
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
      winningsBreakdown
    ),
    [userBets, resolved, winningOption, resolutionDeadlinePassed, hasClaimed, isCreator, winningsBreakdown]
  )

  const hasCreatorFees = isCreator && creatorFeeAmount && creatorFeeAmount > BigInt(0)

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
  // EARLY RETURNS - Guard clauses for cleaner flow
  // ============================================================================
  
  if (!address || !userBets) {
    return null
  }

  // ============================================================================
  // RENDER LOGIC - Clean, declarative UI based on state
  // ============================================================================
  
  return (
    <div className="space-y-6">
      {/* Main Claim Status */}
      {(() => {
        switch (claimStatus.type) {
          case 'already-claimed':
            return (
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/30 rounded-3xl p-6">
                <p className="text-gray-300 mb-2">
                  ✅ You have already claimed your {claimStatus.claimType}.
                </p>
                {claimStatus.amount && (
                  <p className="text-sm text-green-200">
                    Amount claimed: {formatTokenAmount(claimStatus.amount, decimals, isNativeBet)}
                  </p>
                )}
              </div>
            )

          case 'can-claim-winnings':
            return (
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-green-300 mb-3">🎉 Congratulations! You won this bet.</p>
                <p className="text-sm text-green-200 mb-4">
                  Total winnings: {formatTokenAmount(claimStatus.breakdown.totalWinnings, decimals, isNativeBet)}
                </p>
                <ClaimButton
                  onClick={handleClaimWinnings}
                  disabled={isPending}
                  variant="success"
                >
                  {isPending ? 'Claiming...' : `Claim ${formatTokenAmount(claimStatus.breakdown.totalWinnings, decimals, isNativeBet)}`}
                </ClaimButton>

                {claimStatus.breakdown.showFees && (
                  <CollapsibleDetails
                    data={claimStatus.breakdown}
                    type="winnings"
                    decimals={decimals}
                    isNativeBet={isNativeBet}
                  />
                )}
              </div>
            )

          case 'can-claim-refund':
            return (
              <div className="bg-gradient-to-br from-orange-900/40 to-yellow-900/40 backdrop-blur-sm rounded-3xl p-6">
                <p className="text-orange-300 mb-2">
                  This bet was not resolved within 72 hours. You can claim a refund.
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

      {/* Creator Fee Section */}
      {hasCreatorFees && !hasClaimed ? (
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm rounded-3xl p-6">
          <p className="text-yellow-300 mb-4">
            Creator Fees available: {formatTokenAmount(creatorFeeAmount, decimals, isNativeBet)}
          </p>
          
          <ClaimButton
            onClick={handleClaimCreatorFees}
            disabled={isCreatorClaimPending}
            variant="warning"
          >
            {isCreatorClaimPending ? 'Claiming...' : `Claim ${formatTokenAmount(creatorFeeAmount, decimals, isNativeBet)} Creator Fees`}
          </ClaimButton>

          <CollapsibleDetails
            data={feeBreakdown}
            type="fees"
            decimals={decimals}
            isNativeBet={isNativeBet}
          />
        </div>
      ) : null}
    </div>
  )
}