// frontend/app/bets/[id]/components/UnifiedBettingInterface.tsx - Updated with requested changes
'use client'

import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { ConnectKitButton } from 'connectkit'

interface UnifiedBettingInterfaceProps {
  // Bet Info props
  name: string
  isActive: boolean
  resolved: boolean
  winningOption?: number
  timeLeft: number
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
  
  // Betting Interface props
  address?: string
  options?: readonly string[]
  userBets?: readonly bigint[]
  selectedOption: number | null
  setSelectedOption: (option: number | null) => void
  betAmount: string
  setBetAmount: (amount: string) => void
  needsApproval: boolean
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  totalAmounts?: readonly bigint[]
  decimals?: number
  hypeBalance?: bigint
  justPlacedBet?: boolean
  hasExistingBet?: boolean
  isNativeBet?: boolean
}

export function UnifiedBettingInterface({
  // Bet info
  name,
  isActive,
  resolved,
  winningOption,
  timeLeft,
  resolutionTimeLeft,
  resolutionDeadlinePassed,
  
  // Betting interface
  address,
  options,
  userBets,
  selectedOption,
  setSelectedOption,
  betAmount,
  setBetAmount,
  needsApproval,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  totalAmounts,
  decimals,
  hypeBalance,
  //justPlacedBet,
  hasExistingBet,
  isNativeBet = false
}: UnifiedBettingInterfaceProps) {

  const [linkCopied, setLinkCopied] = useState(false)

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getStatusDisplay = () => {
    if (resolved) {
      return {
        text: 'Resolved',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        textColor: 'text-white',
        timeInfo: null,
        icon: '✅'
      }
    }
    
    if (resolutionDeadlinePassed) {
      return {
        text: 'Refund Available',
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        textColor: 'text-white',
        timeInfo: null,
        icon: '💰'
      }
    }
    
    if (!isActive) {
      return {
        text: 'Pending Resolution',
        color: 'bg-gradient-to-r from-yellow-600 to-orange-600',
        textColor: 'text-white',
        timeInfo: resolutionTimeLeft > 0 ? formatTimeRemaining(resolutionTimeLeft) : null,
        icon: '⏳'
      }
    }
    
    return {
      text: 'Active',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-white',
      timeInfo: timeLeft > 0 ? formatTimeRemaining(timeLeft) : null,
      icon: '🎯'
    }
  }

  const status = getStatusDisplay()

  // Calculate totals
  const totalPool = totalAmounts?.reduce((a, b) => a + b, BigInt(0)) || BigInt(0)
  const hasPool = totalPool > BigInt(0)

  // User bet calculations
  const userExistingOptionIndex = userBets?.findIndex(amount => amount > BigInt(0)) ?? -1
  const effectiveSelectedOption = hasExistingBet ? userExistingOptionIndex : selectedOption

  // Auto-select the option user has already bet on
  useEffect(() => {
    if (hasExistingBet && userExistingOptionIndex !== -1 && selectedOption !== userExistingOptionIndex) {
      setSelectedOption(userExistingOptionIndex)
    }
  }, [hasExistingBet, userExistingOptionIndex, selectedOption, setSelectedOption])

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

  // Helper function for dynamic decimal formatting
  const formatDynamicDecimals = (value: string | number): string => {
    const num = parseFloat(value.toString())
    if (isNaN(num) || num === 0) return '0'
    // Show up to 8 decimals, then remove trailing zeros
    return num.toFixed(8).replace(/\.?0+$/, '')
  }

  // Betting logic
  const canBet = address && isActive && !resolved
  const isValidAmount = parseFloat(betAmount || '0') > 0
  const hasBalance = hypeBalance && parseFloat(betAmount || '0') <= parseFloat(formatUnits(hypeBalance, decimals || 18))

  return (
  <div className="">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{name}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Combined Status and Time Pill */}
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${status.color} ${status.textColor} shadow-lg`}>
            <span>{status.icon}</span>
            {status.text}
            {status.timeInfo && <span>• {status.timeInfo}</span>}
          </span>
          
          {/* Pool Total Pill */}
          {hasPool && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-gray-400 to-slate-500 text-black shadow-lg">
              <span>💰</span>
              Pool TVL: {formatDynamicDecimals(formatUnits(totalPool, decimals || 18))} {isNativeBet ? 'HYPE' : 'mHYPE'}
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={copyLink}
        className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2"
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
    
    {/* Your Current Bet
    {hasExistingBet && userBets && options && (
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 mb-6">
        <h3 className="text-xs font-medium text-gray-400 mb-2">Your Current Bet</h3>
        {userBets.map((amount, index) => {
          if (amount === BigInt(0)) return null
          return (
            <div key={index} className="space-y-1">
              <p className="text-lg font-bold text-white">
                {formatDynamicDecimals(formatUnits(amount, decimals || 18))} {isNativeBet ? 'HYPE' : 'mHYPE'} 
                <span className="text-xs"> on</span>
                <span className="text-xs"> {options[index]}</span>
              </p>
            </div>
          )
        })}
      </div>
    )} */}

    {/* Just Placed Bet Success Message
    {justPlacedBet && (
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/40 rounded-3xl p-6 animate-pulse mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">✓</span>
          </div>
          <div>
            <p className="text-green-400 font-semibold">Bet Placed Successfully!</p>
            <p className="text-gray-300 text-sm">Your transaction has been confirmed</p>
          </div>
        </div>
      </div>
    )} */}

    {/* Bet Options */}
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {hasExistingBet && isActive ? '' : ' '}
        </h3>
        
        {/* Show wallet connection prompt if not connected */}
        {!address && (
          <div className="flex justify-center mb-6 p-6 bg-gray-800/40 rounded-2xl"> 
            <div className="text-center">
              <p className="text-gray-300 mb-4">Connect your wallet to start Betting</p>
              <ConnectKitButton />
            </div>
          </div>
        )}

        {/* Options Grid */}
        <div className="grid gap-4">
          {options?.map((option, index) => {
            const totalForOption = totalAmounts?.[index] || BigInt(0)
            const percentage = totalPool > BigInt(0) ? 
              Number((totalForOption * BigInt(10000)) / totalPool) / 100 : 0
            
            const isUserCurrentOption = hasExistingBet && index === userExistingOptionIndex
            const isDisabled = !canBet || (hasExistingBet && !isUserCurrentOption)
            const isSelected = effectiveSelectedOption === index
            const isWinningOption = resolved && winningOption === index
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && setSelectedOption(index)}
                disabled={isDisabled}
                className={`p-4 rounded-2xl text-left transition-all duration-300 ${
                  isWinningOption
                    ? 'border-green-500/60 bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-green-300 shadow-xl shadow-green-500/20'
                    : isSelected
                    ? 'border-green-500/50 bg-gradient-to-br from-green-900/30 to-emerald-900/30 text-green-300 shadow-lg shadow-green-500/10 hover:scale-105'
                    : isUserCurrentOption
                    ? 'border-green-500/40 bg-gradient-to-br from-green-900/25 to-emerald-900/25 text-green-300'
                    : isDisabled
                    ? 'border-gray-700/30 bg-gray-800/20 text-gray-500 cursor-not-allowed opacity-50'
                    : 'border-gray-600/30 bg-gray-800/20 text-gray-300 hover:border-gray-500/50 hover:bg-gray-700/30 hover:scale-105'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{option}</span>
                    {isWinningOption && (
                      <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium">
                        Winner
                      </span>
                    )}
                    {isUserCurrentOption && !isWinningOption && (
                      <span className="text-xs bg-green-500/80 text-white px-3 py-1 rounded-full font-medium">
                        You Bet: {formatDynamicDecimals(formatUnits(userBets?.[index] || BigInt(0), decimals || 18))} {isNativeBet ? 'HYPE' : 'mHYPE'}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-300">
                      {formatDynamicDecimals(formatUnits(totalForOption, decimals || 18))} {isNativeBet ? 'HYPE' : 'mHYPE'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-700/30 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isWinningOption
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : isSelected || isUserCurrentOption
                        ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60' 
                        : 'bg-gradient-to-r from-gray-500/50 to-gray-600/50'
                    }`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Betting Form - Only show if can bet */}
      {canBet && (
        <>
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {hasExistingBet ? 'Additional bet:' : 'Bet amount:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all duration-300"
                style={{
                  boxShadow: 'inset 0 0 0 1px transparent',
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 0 100px rgba(34, 197, 94, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'inset 0 0 0 1px transparent'
                }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                {isNativeBet ? 'HYPE' : 'mHYPE'}
              </div>
            </div>
            
            {/* Balance Display */}
            {hypeBalance && (
              <div className="mt-2 text-sm text-gray-400">
                Balance: {formatDynamicDecimals(formatUnits(hypeBalance, decimals || 8))}  {isNativeBet ? 'HYPE' : 'mHYPE'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isApproving || !isValidAmount || !hasBalance}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/30 disabled:shadow-none"
              >
                {isApproving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Approving...
                  </div>
                ) : (
                  `Approve ${isNativeBet ? 'HYPE' : 'mHYPE'}`
                )}
              </button>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={isPending || !isValidAmount || !hasBalance || selectedOption === null}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-green-500/30 disabled:shadow-none"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Placing Bet...
                  </div>
                ) : (
                  `Place Bet${selectedOption !== null && options ? ` on ${options[selectedOption]}` : ''}`
                )}
              </button>
            )}
            
            {/* Validation Messages */}
            {!isValidAmount && betAmount && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                Please enter a valid amount
              </p>
            )}
            
            {!hasBalance && isValidAmount && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                Insufficient balance
              </p>
            )}
            
            {selectedOption === null && isValidAmount && hasBalance && (
              <p className="text-yellow-400 text-sm text-center bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
                Please select an option to bet on
              </p>
            )}
          </div>
        </>
      )}
    </div>
    </div>
  )
}