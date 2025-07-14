// app/bets/[id]/page.tsx - Fixed with correct hook interface and Step 6 integration
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { useBetIdMapping } from '@/lib/hooks/useBetIdMapping'
import { parseUnits } from 'viem'

// Import existing components
import { BetHeader } from './components/BetHeader'
import { BetInfo } from './components/BetInfo'
import { CreatorActions } from './components/CreatorActions'
import { UserActions } from './components/UserActions'
import { BettingInterface } from './components/BettingInterface'
import { BetCreationPending } from './components/BetCreationPending'
import { ResolveModal } from './components/ResolveModal'
import { BetLookupDebug } from './components/BetLookupDebug'

// Import hooks
import { useBetData } from './hooks/useBetData'
import { useBetActions } from './hooks/useBetActions'

// Simple error state for invalid IDs
function InvalidBetError({ randomId }: { randomId: string }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <BetLookupDebug />
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-400 mb-4">🔍 Bet Not Found</h1>
          <p className="text-gray-300 mb-4">
            The bet ID &quot;<span className="font-mono">{randomId}</span>&quot; was not found.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            This could mean:
          </p>
          <ul className="text-left text-gray-400 text-sm mb-6 space-y-1">
            <li>• The bet doesn&apos;t exist</li>
            <li>• The bet is still being created</li>
            <li>• There&apos;s a network issue</li>
          </ul>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => router.push('/bets')}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to All Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BetPage() {
  const params = useParams()
  const { address } = useAccount()
  const randomBetId = params?.id
  const [retryCount, setRetryCount] = useState(0)
  const [showResolveModal, setShowResolveModal] = useState(false)

  // 🔧 FIXED: Use the correct hook interface
  const { 
    numericBetId, 
    isValidId: isValidBetId, 
    isLoading: isLoadingMappings 
  } = useBetIdMapping(randomBetId as string)

  // Get bet data using the numeric ID
  const {
    betDetails,
    userBets,
    hypeBalance,
    allowance,
    decimals,
    hasClaimed,
    isBetLoading,
    betError,
    refreshAllData
  } = useBetData(isValidBetId ? numericBetId.toString() : '999999', { useReactQuery: true })

  // 🚀 STEP 6: Extract token address from bet details (8th element, index 7)
  const tokenAddress = betDetails?.[7] as string

  // 🚀 STEP 6: Pass token address to useBetActions hook
  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    isPending,
    isApproving,
    justPlacedBet,
    isNativeBet, // 🚀 NEW: Get native bet information
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet
  } = useBetActions(
    isValidBetId ? numericBetId.toString() : '999999',
    tokenAddress // 🚀 STEP 6: Pass token address
  )

  // Auto-retry logic for newly created bets
  useEffect(() => {
    if (isValidBetId && betError && retryCount < 10) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        refreshAllData()
      }, 2000) // Retry every 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [betError, retryCount, isValidBetId, refreshAllData])

  // Show loading while mappings are being loaded
  if (isLoadingMappings) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl mb-4 text-white">Loading bet...</p>
        </div>
      </div>
    )
  }

  // NOW handle invalid ID case after mappings are loaded
  if (!isValidBetId) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Check if this might be a newly created bet that hasn't been mined yet
  const isPossiblyPendingCreation = isValidBetId && (betError || !betDetails) && retryCount < 10

  // Show pending creation state for new bets
  if (isPossiblyPendingCreation) {
    return <BetCreationPending randomId={randomBetId as string} />
  }

  // Loading state for established bets
  if (isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl mb-4 text-white">Loading bet...</p>
        </div>
      </div>
    )
  }

  // No bet details found
  if (!betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Destructure bet details
  const [name, options, creator, endTime, resolved, winningOption, totalAmounts] = betDetails
  const endTimeMs = Number(endTime) * 1000
  const isActive = Date.now() < endTimeMs
  const isCreator = address?.toLowerCase() === creator.toLowerCase()

  // Check if user has existing bet
  const hasExistingBet = userBets?.some(amount => amount > BigInt(0)) || false

  // Calculate user's total bet amount for claiming logic
  const userTotalBet = userBets?.reduce((sum, amount) => sum + amount, BigInt(0)) || BigInt(0)

  // Check if user won
  const userWon = resolved && userBets && userBets[winningOption] > BigInt(0)

  // 🚀 STEP 6: Smart approval logic - skip approval for native HYPE
  const needsApproval = !isNativeBet && // 🚀 NEW: Skip approval for native HYPE
    allowance !== undefined && 
    parseUnits(betAmount || '0', decimals || 18) > allowance &&
    parseFloat(betAmount || '0') > 0

  console.log('🚀 Step 6 Debug:', {
    tokenAddress,
    isNativeBet,
    needsApproval,
    betAmount
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <BetHeader 
          name={name}
          randomId={randomBetId as string}
          numericId={numericBetId}
          creator={creator}
          isCreator={isCreator}
          endTime={endTime}
          resolved={resolved}
          winningOption={winningOption}
          isNativeBet={isNativeBet} // 🚀 STEP 6: Pass native bet info
          tokenAddress={tokenAddress} // 🚀 STEP 6: Pass token address
        />

        {/* Bet Information */}
        <BetInfo 
          options={options}
          totalAmounts={totalAmounts}
          decimals={decimals}
          isActive={isActive}
          resolved={resolved}
          winningOption={winningOption}
          userBets={userBets}
          tokenSymbol={isNativeBet ? 'HYPE' : 'mHYPE'} // 🚀 STEP 6: Show correct token symbol
        />

        {/* Creator Actions (Resolve) */}
        {isCreator && !resolved && !isActive && (
          <CreatorActions
            onResolve={() => setShowResolveModal(true)}
          />
        )}

        {/* User Actions (Claim/Refund) */}
        {!isCreator && resolved && userTotalBet > BigInt(0) && !hasClaimed && (
          <UserActions
            userWon={!!userWon}
            onClaim={handleClaimWinnings}
            winningOption={winningOption}
            userBets={userBets}
            options={options}
          />
        )}

        {/* 🚀 STEP 6: Enhanced Betting Interface with native token support */}
        <BettingInterface
          isActive={isActive}
          address={address}
          options={options}
          userBets={userBets}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isPending={isPending}
          handleApprove={handleApprove}
          handlePlaceBet={handlePlaceBet}
          totalAmounts={totalAmounts}
          decimals={decimals}
          hypeBalance={hypeBalance}
          justPlacedBet={justPlacedBet}
          hasExistingBet={hasExistingBet}
          isNativeBet={isNativeBet} // 🚀 STEP 6: Pass native bet info
        />

        {/* Resolve Modal */}
        <ResolveModal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          options={options}
          onResolve={handleResolveBet}
        />
      </div>
    </div>
  )
}