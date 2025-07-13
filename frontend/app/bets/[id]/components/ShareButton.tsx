// app/bets/[id]/components/ShareButton.tsx - Fixed TypeScript issues
import { useState } from 'react'
import { devConfig } from '@/lib/config'

interface ShareButtonProps {
  betUrlId: string
  betName?: string
  className?: string
}

// Error logging helper that respects production settings
const logError = (message: string, error?: unknown) => {
  if (devConfig.enableConsoleLogging) {
    console.error(message, error)
  }
  // In production, you could send to error tracking service here
  // e.g., Sentry.captureException(error)
}

export function ShareButton({ betUrlId, betName, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const generateShareUrl = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/bets/${betUrlId}`
  }

  const copyToClipboard = async () => {
    try {
      const shareUrl = generateShareUrl()
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logError('Failed to copy:', error)
      // Fallback: create a temporary text area
      fallbackCopyToClipboard(generateShareUrl())
    }
  }

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logError('Fallback copy failed:', error)
    }
    
    document.body.removeChild(textArea)
  }

  const shareNative = async () => {
    if (!navigator.share) {
      copyToClipboard()
      return
    }

    setIsSharing(true)
    try {
      await navigator.share({
        title: betName || 'Check out this bet on Betley',
        text: `Join this bet: ${betName || 'Betley Bet'}`,
        url: generateShareUrl(),
      })
    } catch (error) {
      // User cancelled or error occurred, fall back to copy
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
        copyToClipboard()
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleShare = () => {
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    shareNative() // This function already has its own navigator.share check
  } else {
    copyToClipboard()
  }
}

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors ${className}`}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : isSharing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sharing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </>
        )}
      </button>
      
      {/* Show URL for easy copying */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg text-sm">
        <span className="text-gray-400">betley.app/bets/</span>
        <span className="text-white font-mono">{betUrlId}</span>
        <button
          onClick={copyToClipboard}
          className="p-1 hover:bg-gray-600 rounded transition-colors"
          title="Copy link"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * Minimal share button for smaller spaces
 */
export function ShareButtonCompact({ betUrlId, className = '' }: { betUrlId: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/bets/${betUrlId}`
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logError('Failed to copy:', error)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ${className}`}
      title={copied ? 'Copied!' : 'Copy bet link'}
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )}
    </button>
  )
}