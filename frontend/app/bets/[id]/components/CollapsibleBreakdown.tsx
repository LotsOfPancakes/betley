// CollapsibleBreakdown.tsx - Reusable breakdown details component

'use client'

import { useState } from 'react'
import { formatTokenAmount } from '@/lib/utils/tokenFormatting'
import { type WinningsBreakdown } from '@/lib/utils'
import { type FeeBreakdown } from '../hooks/useBetFeeData'
import { type BetOutcome } from '../utils/calculateOutcomes'

interface CollapsibleBreakdownProps {
  outcome: BetOutcome
  decimals: number
  isNativeBet: boolean
}

export function CollapsibleBreakdown({ 
  outcome, 
  decimals, 
  isNativeBet 
}: CollapsibleBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!outcome.breakdown || !outcome.showBreakdown) return null
  
  const toggleExpanded = () => setIsExpanded(!isExpanded)
  
  // Theme based on outcome type
  const theme = outcome.type === 'winnings' 
    ? { text: 'text-green-200', accent: 'text-green-400' }
    : { text: 'text-yellow-200', accent: 'text-yellow-400' }

  return (
    <div className="mt-3">
      <button 
        onClick={toggleExpanded}
        className={`text-sm ${theme.text} hover:${theme.accent} transition-colors flex items-center gap-1`}
        aria-expanded={isExpanded}
      >
        <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        {isExpanded ? 'Hide breakdown' : 'Show breakdown'}
      </button>
      
      {isExpanded && (
        <div className="mt-2 text-sm space-y-2 text-gray-300 bg-black/20 rounded-lg p-3">
          {outcome.type === 'winnings' && (
            <WinningsBreakdownDetails 
              breakdown={outcome.breakdown as WinningsBreakdown}
              decimals={decimals}
              isNativeBet={isNativeBet}
              theme={theme}
            />
          )}
          
          {outcome.type === 'creator-fees' && (
            <CreatorFeesBreakdownDetails 
              breakdown={outcome.breakdown as FeeBreakdown}
              decimals={decimals}
              isNativeBet={isNativeBet}
              theme={theme}
            />
          )}
        </div>
      )}
    </div>
  )
}

function WinningsBreakdownDetails({ 
  breakdown, 
  decimals, 
  isNativeBet, 
  theme 
}: {
  breakdown: WinningsBreakdown
  decimals: number
  isNativeBet: boolean
  theme: { text: string; accent: string }
}) {
  return (
    <>
      <div className="flex justify-between">
        <span>Your Bet:</span>
        <span>{formatTokenAmount(breakdown.originalBet, decimals, isNativeBet)}</span>
      </div>
      <div className="flex justify-between">
        <span>Share of Losing Pool:</span>
        <span>{formatTokenAmount(breakdown.rawWinningsFromLosers, decimals, isNativeBet)}</span>
      </div>
      
      {/* Show fee deductions in red if they exist */}
      {breakdown.creatorFee > BigInt(0) && (
        <div className="flex justify-between text-red-300">
          <span>Creator Fee (1%):</span>
          <span>-{formatTokenAmount(breakdown.creatorFee, decimals, isNativeBet)}</span>
        </div>
      )}
      {breakdown.platformFee > BigInt(0) && (
        <div className="flex justify-between text-red-300">
          <span>Platform Fee (0.5%):</span>
          <span>-{formatTokenAmount(breakdown.platformFee, decimals, isNativeBet)}</span>
        </div>
      )}

      <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
        <span>Total Winnings:</span>
        <span className={theme.accent}>{formatTokenAmount(breakdown.totalWinnings, decimals, isNativeBet)}</span>
      </div>
    </>
  )
}

function CreatorFeesBreakdownDetails({ 
  breakdown, 
  decimals, 
  isNativeBet, 
  theme 
}: {
  breakdown: FeeBreakdown
  decimals: number
  isNativeBet: boolean
  theme: { text: string; accent: string }
}) {
  return (
    <>
      {breakdown.losingPool > BigInt(0) && (
        <div className="flex justify-between">
          <span>Losing Pool:</span>
          <span>{formatTokenAmount(breakdown.losingPool, decimals, isNativeBet)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Creator Fee:</span>
        <span>{formatTokenAmount(breakdown.creatorFee, decimals, isNativeBet)}</span>
      </div>
      {breakdown.platformFee > BigInt(0) && (
        <div className="flex justify-between">
          <span>Platform Fee:</span>
          <span>{formatTokenAmount(breakdown.platformFee, decimals, isNativeBet)}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
        <span>Total Fees:</span>
        <span className={theme.accent}>{formatTokenAmount(breakdown.totalFees, decimals, isNativeBet)}</span>
      </div>
    </>
  )
}