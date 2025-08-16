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
       {/* Title Row with Status + Timer */}
       <div className="flex items-center gap-4">
        {/* Title - truncated if too long */}
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight flex-1 min-w-0">
          <span className="truncate block">
            {name}
          </span>
        </h1>
        
         {/* Right side - Status + Timer + Creator Dropdown */}
         <div className="flex items-center gap-3 flex-shrink-0">
           {/* Combined Status and Time Pill */}
           <span 
             className={`inline-flex items-center gap-1 px-4 py-2 rounded-2xl text-sm font-medium ${status.color} ${status.textColor} shadow-lg whitespace-nowrap`}
           >
             <span>{status.icon}</span>
             {status.text}
             {status.timeInfo&&<span>• {status.timeInfo}</span>}
           </span>
           
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
        {/* Left side - Visibility + Pool TVL */}
        <div className="flex items-center gap-3">
          {/* Visibility Indicator Pill */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium ${
            isPublic 
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30' 
              : 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 text-gray-300 border border-gray-600/30'
          } shadow-lg whitespace-nowrap`}>
            <span>{isPublic ? '🌍' : '🔒'}</span>
            {isPublic ? 'Public' : 'Private'}
          </span>
          
          {/* Pool TVL Pill */}
          {hasPool && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg">
              <span>💰</span>
              Pool: {formatDynamicDecimals(formatUnits(totalPool, decimals))} {tokenSymbol}
            </span>
          )}
        </div>
        
        {/* Right side - Share Button */}
        <button
          onClick={copyLink}
          className="text-sm bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-1.5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2 whitespace-nowrap"
        >
          {linkCopied ? (
            <>
              <span className="text-green-400">✓</span>
              Link Copied!
            </>
          ) : (
            <>
              <span>🔗</span>
              Share
            </>
          )}
        </button>
      </div>
    </div>
  )
}