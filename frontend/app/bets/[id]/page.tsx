// frontend/app/bets/[id]/page.tsx - Cleaned up version
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { useBetIdMapping } from '@/lib/hooks/useBetIdMapping'
import { parseUnits } from 'viem'

// Import only the components we actually use
import { CreatorActions } from './components/CreatorActions'
import { UserActions } from './components/UserActions'
import { UnifiedBettingInterface } from './components/UnifiedBettingInterface'
import { ResolveModal } from './components/ResolveModal'

// Import hooks
import { useBetData } from './hooks/useBetData'
import { useBetActions } from './hooks/useBetActions'

// Error state for invalid IDs
function InvalidBetError({ randomId }: { randomId: string }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-400 mb-4">🔍 Bet Not Found</h1>
          <p className="text-gray-300 mb-4">
            The bet ID &quot;<span className="font-mono">{randomId}</span>&quot; was not found.
          </p>
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
  const [showResolveModal, setShowResolveModal] = useState(false)

  // Get numeric bet ID from random ID
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
    isBetLoading
  } = useBetData(isValidBetId && numericBetId !== null ? numericBetId.toString() : '999999', { useReactQuery: true })

  // Extract token address from bet details
  const tokenAddress = betDetails?.[7] as string

  // Get bet actions
  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    isPending,
    isApproving,
    justPlacedBet,
    isNativeBet,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet
  } = useBetActions(
    isValidBetId && numericBetId !== null ? numericBetId.toString() : '999999',
    tokenAddress
  )

  // Loading states
  if (isLoadingMappings || isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl mb-4 text-white">Loading bet...</p>
        </div>
      </div>
    )
  }

  // Invalid bet ID
  if (!isValidBetId || !betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Destructure bet details
  const [name, options, creator, endTime, resolved, winningOption, totalAmounts] = betDetails
  const endTimeMs = Number(endTime) * 1000
  const isActive = Date.now() < endTimeMs
  const isCreator = address?.toLowerCase() === creator.toLowerCase()
  const timeLeft = isActive ? Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000)) : 0

  // Calculate resolution time left (72 hours after betting ends)
  const resolutionDeadlineMs = endTimeMs + (72 * 60 * 60 * 1000) // 72 hours after end time
  const resolutionTimeLeft = !resolved && !isActive ? Math.max(0, Math.floor((resolutionDeadlineMs - Date.now()) / 1000)) : 0
  const resolutionDeadlinePassed = !resolved && Date.now() > resolutionDeadlineMs

  // Check if user has existing bet
  const hasExistingBet = userBets?.some(amount => amount > BigInt(0)) || false

  // Calculate user's total bet amount for claiming logic
  const userTotalBet = userBets?.reduce((sum, amount) => sum + amount, BigInt(0)) || BigInt(0)

  // Smart approval logic - skip approval for native HYPE
  const needsApproval = !isNativeBet && 
    allowance !== undefined && 
    parseUnits(betAmount || '0', decimals || 18) > allowance &&
    parseFloat(betAmount || '0') > 0

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Main Unified Betting Interface */}
        <UnifiedBettingInterface
          // Bet info props
          name={name}
          isActive={isActive}
          resolved={resolved}
          winningOption={winningOption}
          timeLeft={timeLeft}
          resolutionTimeLeft={resolutionTimeLeft}
          resolutionDeadlinePassed={resolutionDeadlinePassed}
          
          // Betting interface props
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
          isNativeBet={isNativeBet}
        />

        {/* Creator Actions - Only show if user is creator and bet needs resolution */}
        {isCreator && !isActive && !resolved && (
          <div className="mt-6">
            <CreatorActions
              address={address}
              creator={creator}
              timeLeft={timeLeft}
              resolved={resolved}
              resolutionDeadlinePassed={resolutionDeadlinePassed}
              resolutionTimeLeft={resolutionTimeLeft}
              onShowResolveModal={() => setShowResolveModal(true)}
            />
          </div>
        )}

        {/* User Actions - Only show if user won and can claim */}
        {resolved && userTotalBet > BigInt(0) && !hasClaimed && (
          <div className="mt-6">
            <UserActions
              address={address}
              resolved={resolved}
              winningOption={winningOption}
              userBets={userBets}
              totalAmounts={totalAmounts}
              resolutionDeadlinePassed={resolutionDeadlinePassed}
              hasClaimed={hasClaimed}
              decimals={decimals}
              isPending={isPending}
              handleClaimWinnings={handleClaimWinnings}
            />
          </div>
        )}

        {/* Resolve Modal */}
        <ResolveModal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          options={options}
          onResolve={handleResolveBet}
          betName={name}
        />
      </div>
    </div>
  )
}