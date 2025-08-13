// frontend/app/bets/[id]/components/BetStatusHeader.tsx
'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'
import { getBetStatusDisplay, formatDynamicDecimals, type BetStatusDisplay } from '@/lib/utils/bettingUtils'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'

interface BetStatusHeaderProps {
  name: string
  isActive: boolean
  resolved: boolean
  resolutionDeadlinePassed: boolean
  timeLeft: number
  resolutionTimeLeft: number
  totalPool: bigint
  decimals: number
  isNativeBet: boolean
}

export function BetStatusHeader({
  name,
  isActive,
  resolved,
  resolutionDeadlinePassed,
  timeLeft,
  resolutionTimeLeft,
  totalPool,
  decimals,
  isNativeBet
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
    } catch (err) {
      console.error('Failed to copy link:', err)
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
        
        {/* Right side - Status + Timer */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Combined Status and Time Pill */}
          <span 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${status.color} ${status.textColor} shadow-lg whitespace-nowrap`}
          >
            <span>{status.icon}</span>
            {status.text}
            {status.timeInfo && <span>• {status.timeInfo}</span>}
          </span>
        </div>
      </div>
      
      {/* Pool TVL and Share Button Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Pool TVL */}
        <div className="flex items-center">
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
          className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-5 py-2 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2 whitespace-nowrap"
        >
          {linkCopied ? (
            <>
              <span className="text-green-400">✓</span>
              Copied!
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