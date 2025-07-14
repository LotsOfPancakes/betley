// frontend/app/bets/[id]/components/BetHeader.tsx - Step 6: Token Type Display
'use client'

import { useRouter } from 'next/navigation'

interface BetHeaderProps {
  name: string
  randomId: string
  numericId: number
  creator: string
  isCreator: boolean
  endTime: bigint
  resolved: boolean
  winningOption?: number
  isNativeBet?: boolean // 🚀 NEW: Native bet detection
  tokenAddress?: string // 🚀 NEW: Token address
}

export function BetHeader({
  name,
  randomId,
  numericId,
  creator,
  isCreator,
  endTime,
  resolved,
  winningOption,
  isNativeBet = false, // 🚀 NEW
  tokenAddress // 🚀 NEW
}: BetHeaderProps) {
  const router = useRouter()
  const endTimeMs = Number(endTime) * 1000
  const isActive = Date.now() < endTimeMs

  // 🚀 NEW: Token display logic
  const getTokenDisplay = () => {
    if (isNativeBet) {
      return {
        symbol: 'HYPE',
        name: 'Native HYPE',
        icon: '⚡',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-600',
        textColor: 'text-green-300'
      }
    } else {
      return {
        symbol: 'mHYPE',
        name: 'Mock HYPE Token',
        icon: '🔗',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-600',
        textColor: 'text-blue-300'
      }
    }
  }

  const tokenDisplay = getTokenDisplay()

  const getStatusBadge = () => {
    if (resolved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-300 border border-green-600">
          ✅ Resolved
        </span>
      )
    } else if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-300 border border-blue-600">
          🔴 Live
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-600">
          ⏳ Pending Resolution
        </span>
      )
    }
  }

  const formatTimeRemaining = () => {
    if (resolved) return 'Bet resolved'
    
    const now = Date.now()
    const timeLeft = endTimeMs - now
    
    if (timeLeft <= 0) return 'Betting ended'
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/bets')}
        className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
      >
        ← Back to All Bets
      </button>

      {/* Main header content */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{name}</h1>
          
          {/* Bet metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>ID: <span className="font-mono text-gray-300">{randomId}</span></span>
            <span>Internal: <span className="font-mono text-gray-300">#{numericId}</span></span>
            {isCreator && <span className="text-blue-400 font-medium">👑 Your Bet</span>}
          </div>

          {/* Creator info */}
          <div className="mt-2 text-sm text-gray-400">
            Created by: <span className="font-mono text-gray-300">{creator.slice(0, 6)}...{creator.slice(-4)}</span>
          </div>
        </div>

        {/* Status and token info */}
        <div className="flex flex-col items-start lg:items-end gap-3">
          {getStatusBadge()}
          
          {/* 🚀 NEW: Token type indicator */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tokenDisplay.bgColor} ${tokenDisplay.textColor} border ${tokenDisplay.borderColor}`}>
            <span className="mr-1">{tokenDisplay.icon}</span>
            {tokenDisplay.symbol}
          </div>
        </div>
      </div>

      {/* Time info */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="text-gray-400">Status: </span>
            <span className={`font-medium ${
              resolved ? 'text-green-400' : 
              isActive ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              {formatTimeRemaining()}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            Ends: {new Date(endTimeMs).toLocaleString()}
          </div>
        </div>

        {/* 🚀 NEW: Token information section */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
            <div className="flex items-center text-gray-400">
              <span className="mr-2">{tokenDisplay.icon}</span>
              <span>Token: </span>
              <span className={`font-medium ml-1 ${tokenDisplay.textColor}`}>
                {tokenDisplay.name}
              </span>
            </div>
            
            {tokenAddress && (
              <div className="text-gray-500 font-mono text-xs">
                {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
              </div>
            )}
          </div>

          {/* 🚀 NEW: Token benefits indicator */}
          <div className="mt-2 text-xs text-gray-500">
            {isNativeBet ? (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                No approval required • Direct transfers • Lower gas costs
              </span>
            ) : (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                ERC20 token • Approval required • Standard transfers
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resolution info */}
      {resolved && winningOption !== undefined && (
        <div className="mt-4 bg-green-900/20 border border-green-600 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-400 font-medium">🏆 Winning Option: </span>
            <span className="text-white ml-2">Option {winningOption + 1}</span>
          </div>
        </div>
      )}
    </div>
  )
}