// frontend/app/bets/[id]/components/ShareButton.tsx 
'use client'

import { useState } from 'react'
import { appConfig } from '@/lib/config'

interface ShareButtonProps {
  betUrlId: string
  betName?: string
  className?: string
}

export function ShareButton({ betUrlId, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
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
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500">
      <div className="flex items-center justify-between">
        {/* URL Display */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-gray-400 text-sm shrink-0">{new URL(appConfig.url).hostname}/bets/</span>
          <span className="text-white font-mono text-sm truncate">{betUrlId}</span>
        </div>
        
        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-2xl transition-all duration-300 hover:scale-105 ml-3 shrink-0 shadow-xl shadow-blue-500/30 ${className}`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * Compact version for smaller spaces (used in headers/toolbars)
 */
export function ShareButtonCompact({ 
  betUrlId, 
  className = '' 
}: { 
  betUrlId: string; 
  className?: string 
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
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
    <button
      onClick={copyToClipboard}
      className={`bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2 ${className}`}
      title={copied ? 'Copied!' : 'Copy link to share this bet'}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Share</span>
        </>
      )}
    </button>
  )
}