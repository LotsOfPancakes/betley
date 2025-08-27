// OutcomeLine.tsx - Individual outcome display component. It's what's inside each BetOutcomes

'use client'

import { formatTokenAmount } from '@/lib/utils/tokenFormatting'
import { CollapsibleBreakdown } from './CollapsibleBreakdown'
import { BetOutcomeIcon } from './BetOutcomeIcon'
import { type BetOutcome } from '../utils/calculateOutcomes'

interface OutcomeLineProps {
  outcome: BetOutcome
  onClaim?: () => void
  isPending: boolean
  decimals: number
  isNativeBet: boolean
}

export function OutcomeLine({ 
  outcome, 
  onClaim, 
  isPending, 
  decimals, 
  isNativeBet 
}: OutcomeLineProps) {
  // Color styles based on outcome type
  const colorStyles = {
    green: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      button: 'bg-green-500 hover:bg-green-400 text-white'
    },
    red: {
      bg: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/30',
      button: 'bg-red-500 hover:bg-red-400 text-white'
    },
    yellow: {
      bg: 'from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/30',
      button: 'bg-yellow-500 hover:bg-yellow-400 text-white'
    },
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      button: 'bg-blue-500 hover:bg-blue-400 text-white'
    }
  }

  const styles = colorStyles[outcome.color]

  return (
    <div className={`bg-gradient-to-r ${styles.bg} border ${styles.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        {/* Left side: Icon and details */}
        <div className="flex items-center gap-3">
          <BetOutcomeIcon type={outcome.type} size="lg" />
          <div>
            <div className="text-white font-medium">{outcome.label}</div>
            <div className="text-gray-300 text-sm">
              {formatTokenAmount(outcome.amount, decimals, isNativeBet)}
            </div>
          </div>
        </div>
        
        {/* Right side: Action button or status */}
        <div className="flex flex-col items-end gap-1">
          {outcome.canClaim && onClaim && (
            <button 
              onClick={onClaim}
              disabled={isPending}
              className={`${styles.button} px-8 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isPending ? 'Claiming...' : 'Claim'}
            </button>
          )}
          
          {outcome.alreadyClaimed && (
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <span>Claimed</span>
              <span className="text-green-400">✓</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Collapsible breakdown details */}
      <CollapsibleBreakdown 
        outcome={outcome}
        decimals={decimals}
        isNativeBet={isNativeBet}
      />
    </div>
  )
}