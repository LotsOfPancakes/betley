// frontend/app/bets/[id]/components/BetHeader.tsx - With Share Button
'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'

interface BetHeaderProps {
  address?: string
  hypeBalance?: bigint
  decimals?: number
  betUrlId?: string  // New prop for share functionality
}

export function BetHeader({ 
  address, 
  hypeBalance, 
  decimals,
  betUrlId 
}: BetHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!betUrlId) return
    
    try {
      const url = `${window.location.origin}/bets/${betUrlId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = `${window.location.origin}/bets/${betUrlId}`
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-white">Betley</h1>
      
      <div className="flex items-center gap-3">
        {/* Share Button - Same height as balance */}
        {betUrlId && (
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-semibold">Share</span>
              </>
            )}
          </button>
        )}
        
        {/* Balance Display */}
        {address && hypeBalance !== undefined && decimals && (
          <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="font-semibold text-white">{formatUnits(hypeBalance, decimals)} HYPE</p>
          </div>
        )}
      </div>
    </div>
  )
}