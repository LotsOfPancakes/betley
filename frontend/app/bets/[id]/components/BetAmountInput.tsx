// frontend/app/bets/[id]/components/BetAmountInput.tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAppKit } from '@reown/appkit/react'
import { formatDynamicDecimals, isValidBetAmount, hasWalletBalance } from '@/lib/utils/bettingUtils'
import { calculatePotentialWinningsPreview } from '@/lib/utils/winningsCalculator'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'

interface BetAmountInputProps {
  betAmount: string
  setBetAmount: (amount: string) => void
  balance: bigint
  decimals: number
  isNativeBet: boolean
  hasExistingBet: boolean
  needsApproval: boolean
  isApproving: boolean
  isPending: boolean
  handleApprove: () => void
  handlePlaceBet: () => void
  selectedOption: number | null
  options: readonly string[]
  // New props for potential winnings calculation
  totalAmounts?: readonly bigint[]
  feeParams?: readonly [boolean, bigint, boolean, bigint, string]
  // New props for wallet connection flow
  address?: string
  isActive: boolean
  resolved: boolean
  betId: string
}

export function BetAmountInput({
  betAmount,
  setBetAmount,
  balance,
  decimals,
  isNativeBet,
  hasExistingBet,
  needsApproval,
  isApproving,
  isPending,
  handleApprove,
  handlePlaceBet,
  selectedOption,
  options,
  totalAmounts,
  feeParams,
  address,
  isActive,
  resolved,
  betId
}: BetAmountInputProps) {

  // Client-side check to avoid SSR issues with AppKit
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // AppKit hook for wallet connection - always call the hook
  const { open } = useAppKit()

  // Get token symbol
  const tokenSymbol = getTokenSymbol(isNativeBet)

  // Connection and betting state
  const isConnected = Boolean(address)
  
  // Whitelist state
  const [canBet, setCanBet] = useState(true) // Start optimistic

  // Check whitelist status when wallet connects
  useEffect(() => {
    if (address && betId) {
      fetch(`/api/bets/${betId}/whitelist`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.hasWhitelist) {
            const isWhitelisted = data.data.addresses.some(
              (addr: { participant_address: string }) => 
                addr.participant_address.toLowerCase() === address.toLowerCase()
            )
            setCanBet(isWhitelisted)
          }
          // If no whitelist or API fails, keep canBet = true
        })
        .catch(() => {}) // Silently fail, keep canBet = true
    }
  }, [address, betId])

  // Validation logic - only check balance if connected
  const isValidAmount = isValidBetAmount(betAmount)
  const hasBalance = isConnected ? hasWalletBalance(betAmount, balance, decimals) : true

  // Button click handler
  const handleButtonClick = () => {
    if (!isConnected) {
      // Only attempt to open wallet connection if we're on the client side
      if (isClient && open) {
        try {
          open()
        } catch (error) {
          console.warn('Failed to open wallet connection:', error)
        }
      } else {
        console.warn('AppKit not available - wallet connection unavailable')
      }
      return
    }
    
    // Existing connected user logic
    if (needsApproval) {
      handleApprove()
    } else {
      handlePlaceBet()
    }
  }

  // Calculate potential winnings (net profit after deducting bet amount)
  const potentialWinnings = useMemo(() => {
    if (!isValidAmount || selectedOption === null || !totalAmounts || !betAmount) {
      return BigInt(0)
    }

    try {
      const betAmountWei = parseUnits(betAmount, decimals)
      return calculatePotentialWinningsPreview(
        betAmountWei,
        selectedOption,
        totalAmounts,
        feeParams
      )
    } catch {
      return BigInt(0)
    }
  }, [betAmount, selectedOption, totalAmounts, feeParams, decimals, isValidAmount])

  // Format potential winnings for display
  const formattedPotentialWinnings = useMemo(() => {
    if (potentialWinnings === BigInt(0)) return null
    return formatDynamicDecimals(formatUnits(potentialWinnings, decimals))
  }, [potentialWinnings, decimals])

  // Calculate multiplier (how many times the bet amount user gets back)
  const multiplier = useMemo(() => {
    if (potentialWinnings === BigInt(0) || !isValidAmount || !betAmount) return null
    
    try {
      const betAmountWei = parseUnits(betAmount, decimals)
      if (betAmountWei === BigInt(0)) return null
      
      // Multiplier = potential winnings / bet amount (profit multiplier)
      const multiplierValue = Number(formatUnits(potentialWinnings, decimals)) / Number(betAmount)

      return multiplierValue.toFixed(1) + 'x'
    } catch {
      return null
    }
  }, [potentialWinnings, betAmount, decimals, isValidAmount])

  // Check if we should show the potential winnings preview
  const shouldShowPotentialWinnings = Boolean(
    isValidAmount &&
    selectedOption !== null &&
    formattedPotentialWinnings &&
    options[selectedOption]
  )

  // Button state helpers
  const getButtonDisabledState = () => {
    if (!isConnected) {
      // Not connected: button is enabled to trigger connection
      return false
    }

    if (!isActive || resolved) {
      // Bet ended or resolved: disable button
      return true
    }

    // Connected user: check validation states
    const hasValidationErrors = !isValidAmount || !hasBalance || selectedOption === null || !canBet
    const isProcessing = isPending || isApproving
    
    return hasValidationErrors || isProcessing
  }

  const getButtonStyles = () => {
    if (!isConnected) {
      // Connection button: Blue gradient
      return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:scale-105'
    }

    if (!isActive || resolved) {
      // Inactive/resolved: Gray
      return 'bg-gray-600 text-gray-400 cursor-not-allowed'
    }

    if (getButtonDisabledState()) {
      // Disabled: Gray
      return 'bg-gray-600 text-gray-400 cursor-not-allowed'
    }

    if (needsApproval) {
      // Approval: Blue gradient
      return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:scale-105'
    }

    // Place bet: Green gradient
    return 'bg-gradient-to-r from-green-600 to-emerald-500/90 hover:from-green-500/90 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:scale-105'
  }

  const getButtonContent = () => {
    if (!isConnected) {
      return 'Connect Wallet to Bet'
    }

    if (!isActive) {
      return 'Betting Closed'
    }

    if (resolved) {
      return 'Bet Resolved'
    }

    // Connected user states
    if (isPending) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Placing Bet...
        </div>
      )
    }

    if (isApproving) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Approving...
        </div>
      )
    }

    if (!isValidAmount && betAmount) {
      return 'Please enter a valid amount'
    }

    if (!hasBalance && isValidAmount) {
      return `Insufficient ${tokenSymbol} balance`
    }

    if (selectedOption === null && isValidAmount && hasBalance && canBet) {
      return 'Please select an option above'
    }

    if (!canBet && isValidAmount && hasBalance && selectedOption !== null) {
      return 'You are not whitelisted'
    }

    if (needsApproval) {
      return `Approve ${tokenSymbol}`
    }

    if (selectedOption !== null && options) {
      return `Place Bet on "${options[selectedOption]}"`
    }

    return 'Place Bet'
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/80 backdrop-blur-sm border-green-600/20 rounded-3xl p-5 space-y-4">
      {/* Amount Input */}
      <div>
        {/* Input Row */}
        <div className="flex items-center justify-between">
          {/* Left - Label */}
          <span className="text-sm font-medium text-gray-300">
            {hasExistingBet ? 'Additional Bet' : 'Bet Amount'}
          </span>
          
          {/* Right - Input with Sticky Token */}
          <div className="flex-1 max-w-[200px]">
            <div className="flex items-center text-2xl text-white justify-end">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                className="outline-none placeholder-gray-500 text-right flex-1 min-w-0 py-2"
              />
              <span className={`ml-1.5 font-medium ${betAmount ? 'text-white' : 'text-gray-500'}`}>
                {tokenSymbol}
              </span>
            </div>
          </div>
        </div>
        
        {/* Balance Display - only show if connected */}
        {isConnected && balance !== undefined && (
          <div className="mt-2 text-xs text-gray-400 text-right">
            Balance: {formatDynamicDecimals(formatUnits(balance, decimals))} {tokenSymbol}
          </div>
        )}

        {/* Separator Line */}
        {shouldShowPotentialWinnings && (
          <div className="mt-3 mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
          </div>
        )}

        {/* Potential Winnings Preview - only show if connected + bet is active */}
        {isConnected && shouldShowPotentialWinnings && isActive && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400">Potential win:</span>
            <span className="text-green-400 font-medium text-sm">
              {formattedPotentialWinnings} {tokenSymbol} {multiplier && `(${multiplier})`}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div>
        <button
          onClick={handleButtonClick}
          disabled={getButtonDisabledState()}
          className={`w-full py-4 px-6 rounded-2xl font-semibold text-center transition-all duration-300 ${getButtonStyles()}`}
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  )
}