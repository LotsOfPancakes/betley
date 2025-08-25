// frontend/app/bets/[id]/components/BetStatusHeader.tsx
'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'
import { getBetStatusDisplay, formatDynamicDecimals, type BetStatusDisplay } from '@/lib/utils/bettingUtils'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'
import { CreatorDropdown } from './CreatorDropdown'

interface BetStatusHeaderProps {
  name: string
  isPublic: boolean
  isActive: boolean
  resolved: boolean
  resolutionDeadlinePassed: boolean
  timeLeft: number
  resolutionTimeLeft: number
  totalPool: bigint
  decimals: number
  isNativeBet: boolean
  address?: string
  creator: string
  onResolveEarly: () => void
  onManageWhitelist: () => void
}

export function BetStatusHeader({
  name,
  isPublic,
  isActive,
  resolved,
  resolutionDeadlinePassed,
  timeLeft,
  resolutionTimeLeft,
  totalPool,
  decimals,
  isNativeBet,
  address,
  creator,
  onResolveEarly,
  onManageWhitelist
}: BetStatusHeaderProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Get status display configuration
  const status: BetStatusDisplay = getBetStatusDisplay(
    isActive,
    resolved,
    resolutionDeadlinePassed,
    timeLeft,
    resolutionTimeLeft
  )

  // Get token symbol
  const tokenSymbol = getTokenSymbol(isNativeBet)

  // Copy link functionality
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Silently fail - user will notice if copy didn't work
    }
  }

  const hasPool = totalPool > BigInt(0)

  return (
    <div className="space-y-3 mb-6">
       {/* Title Row with Creator Dropdown */}
       <div className="flex items-center gap-4">
        {/* Title - truncated if too long */}
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight flex-1 min-w-0">
          <span className="truncate block">
            {name}
          </span>
        </h1>
        
         {/* Right side - Creator Dropdown only */}
         <div className="flex items-center gap-3 flex-shrink-0">
            {/* Creator Dropdown */}
            <CreatorDropdown
              address={address}
              creator={creator}
              resolved={resolved}
              onResolveEarly={onResolveEarly}
              onManageWhitelist={onManageWhitelist}
            />
         </div>
      </div>
      
      {/* Pool TVL and Share Button Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Pool Size + Status + Visibility */}
        <div className="flex items-center gap-3">
           {/* Combined pool, status and visibility as light grey subtitle text */}
           <div className="relative">
             <span className="text-gray-300/80 text-base flex items-center">
               {hasPool && (
                 <>
                   <svg className="w-4 h-4 mr-1.5 text-gray-300/80" fill="currentColor" viewBox="0 0 20 20">
                     <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                   </svg>
                   Pool: {formatDynamicDecimals(formatUnits(totalPool, decimals))} {tokenSymbol}
                   <span className="mx-3">|</span>
                 </>
               )}
               <svg className="w-4 h-4 mr-1.5 text-gray-300/80" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
               </svg>
               {status.text}
               {status.timeInfo && <span> • {status.timeInfo}</span>}
               <span className="mx-3">|</span>
               <span>{isPublic ? 'Public' : 'Private'}</span>
               {!isPublic && (
                 <span 
                   className="ml-2 inline-block w-3 h-3 rounded-full bg-gray-500/30 text-xs cursor-help hover:bg-gray-400/40 transition-colors text-center leading-3"
                   onMouseEnter={() => setShowTooltip(true)}
                   onMouseLeave={() => setShowTooltip(false)}
                 >
                   i
                 </span>
               )}
             </span>
             
             {/* Tooltip */}
             {!isPublic && showTooltip && (
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-sm text-gray-200 z-50">
                 <div className="text-center">
                   Private bets are not visible on the Public Bets list. If you want someone to participate, send them the link. But note that anyone with the link can participate unless a whitelist is in place.
                 </div>
                 {/* Arrow pointing down */}
                 <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
               </div>
             )}
           </div>
        </div>
        
        {/* Right side - Share Button */}
        <button
          onClick={copyLink}
          className="text-sm bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-1.5 rounded-2xl transition-all duration-300 hover:scale-102 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
        >
          {linkCopied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Link Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" clipRule="evenodd"/>
                <path fillRule="evenodd" d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z" clipRule="evenodd"/>
              </svg>
              Share
            </>
          )}
        </button>
      </div>
    </div>
  )
}