// BetOutcomeIcon.tsx - Professional SVG icons for bet outcomes

'use client'

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

  // Render appropriate SVG based on type
  switch (type) {
    case 'winnings':
      return (
        <svg 
          className={baseClassName} 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-label="Winnings"
        >
          {/* Trophy cup - celebratory success icon */}
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a1 1 0 100-2V7a1 1 0 00-1-1H8a1 1 0 00-1 1v2zm2-2v4h2V7H9z" clipRule="evenodd"/>
          <path d="M6 8a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zM14 8a1 1 0 01-1-1h-.01a1 1 0 010-2H13a1 1 0 011 1z"/>
        </svg>
      )

    case 'lost':
      return (
        <svg 
          className={baseClassName} 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-label="Lost"
        >
          {/* Trending down chart - professional loss indicator */}
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm4-11a1 1 0 10-2 0v3.586L9 7.586A1 1 0 007.586 9L6.293 10.293a1 1 0 001.414 1.414L9 10.414l2.293 2.293A1 1 0 0013 11.414V7z" clipRule="evenodd"/>
        </svg>
      )

    case 'creator-fees':
      return (
        <svg 
          className={baseClassName} 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-label="Creator Fees"
        >
          {/* Crown - authority/creator symbol */}
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-6a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
          <path d="M10 4l1.5 2L10 8 8.5 6 10 4zM7 7l1 3h4l1-3-1.5 1L10 6.5 8.5 8 7 7z"/>
        </svg>
      )

    case 'refund':
      return (
        <svg 
          className={baseClassName} 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-label="Refund"
        >
          {/* Return arrow - protective, return-focused */}
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd"/>
        </svg>
      )

    default:
      return null
  }
}