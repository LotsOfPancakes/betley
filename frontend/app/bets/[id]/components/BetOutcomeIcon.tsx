// BetOutcomeIcon.tsx - Professional SVG icons for bet outcomes using Heroicons

'use client'

import { 
  TrophyIcon,
  ArrowTrendingDownIcon, 
  BanknotesIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/solid'

interface BetOutcomeIconProps {
  type: 'winnings' | 'lost' | 'creator-fees' | 'refund'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BetOutcomeIcon({ 
  type, 
  size = 'lg', 
  className 
}: BetOutcomeIconProps) {
  // Size mapping following Betley's established patterns
  const sizeClasses = {
    sm: 'w-4 h-4',  // 16px - Used in BetStatusHeader
    md: 'w-5 h-5',  // 20px - Used in NotificationToast  
    lg: 'w-6 h-6'   // 24px - Primary for BetOutcomes
  }

  // Color mapping following Betley's theme system
  const colorClasses = {
    winnings: 'text-green-400',
    lost: 'text-red-400', 
    'creator-fees': 'text-yellow-400',
    refund: 'text-blue-400'
  }

  const baseClassName = `${sizeClasses[size]} ${className || colorClasses[type]}`

  // Render appropriate Heroicon based on type
  switch (type) {
    case 'winnings':
      return <TrophyIcon className={baseClassName} aria-label="Winnings" />

    case 'lost':
      return <ArrowTrendingDownIcon className={baseClassName} aria-label="Lost" />

    case 'creator-fees':
      return <BanknotesIcon className={baseClassName} aria-label="Creator Fees" />

    case 'refund':
      return <ReceiptRefundIcon className={baseClassName} aria-label="Refund" />

    default:
      return null
  }
}