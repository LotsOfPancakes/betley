// frontend/app/bets/[id]/components/BetStatusHeader.tsx
'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'
import { getBetStatusDisplay, formatDynamicDecimals, type BetStatusDisplay } from '@/lib/utils/bettingUtils'
import { getTokenConfig, ZERO_ADDRESS } from '@/lib/tokenUtils'

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
  const tokenSymbol = getTokenConfig(isNativeBet ? ZERO_ADDRESS : '0x1234567890123456789012345678901234567890').symbol

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          {name}
        </h1>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Combined Status and Time Pill */}
          <span 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${status.color} ${status.textColor} shadow-lg`}
          >
            <span>{status.icon}</span>
            {status.text}
            {status.timeInfo && <span>• {status.timeInfo}</span>}
          </span>
          
          {/* Pool Total Pill */}
          {hasPool && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-gray-400 to-slate-500 text-black shadow-lg">
              <span>💰</span>
              Pool TVL: {formatDynamicDecimals(formatUnits(totalPool, decimals))} {tokenSymbol}
            </span>
          )}
        </div>
      </div>
      
      {/* Share Button */}
      <button
        onClick={copyLink}
        className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-5 py-2 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2"
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
  )
}