// frontend/app/bets/[id]/page.tsx - Updated to pass betId and isNativeBet to UserActions
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
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'

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
    isBetLoading,
    isNativeBet, // ✅ Get this from useBetData
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed
  } = useBetData(isValidBetId && numericBetId !== null ? numericBetId.toString() : '999999', { useReactQuery: true })

  // Extract bet data
  const name = betDetails?.[0] as string
  const options = betDetails?.[1] as readonly string[]
  const creator = betDetails?.[2] as string
  const endTime = betDetails?.[3] as bigint
  const resolved = betDetails?.[4] as boolean
  const winningOption = betDetails?.[5] as number
  const totalAmounts = betDetails?.[6] as readonly bigint[]
  const tokenAddress = betDetails?.[7] as string

  // Get bet actions (provide fallback string to avoid undefined)
  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    justPlacedBet,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    isPending,
    isApproving,
  } = useBetActions(
    numericBetId ? numericBetId.toString() : '0',
    tokenAddress
  )
  
  // Loading states
  if (isLoadingMappings || isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading bet...</p>
        </div>
      </div>
    )
  }

  // Invalid bet ID
  if (!isValidBetId || !betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Check if user is creator
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()

  // Calculate time values
  const endTimeMs = Number(endTime) * 1000
  const isActive = Date.now() < endTimeMs

  // Check if user has existing bet
  const hasExistingBet = userBets?.some(amount => amount > BigInt(0)) || false

  // Smart approval logic - skip approval for native HYPE
  const needsApproval = !isNativeBet && 
    allowance !== undefined && 
    parseUnits(betAmount || '0', decimals || 18) > allowance &&
    parseFloat(betAmount || '0') > 0

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Main Unified Betting Interface */}
          <ComponentErrorBoundary>
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
          </ComponentErrorBoundary>

          {/* Creator Actions - Only show if user is creator and bet needs resolution */}
          {isCreator && !isActive && !resolved && (
            <div className="mt-6">
              <ComponentErrorBoundary>
                <CreatorActions
                  address={address}
                  creator={creator}
                  timeLeft={timeLeft}
                  resolved={resolved}
                  resolutionDeadlinePassed={resolutionDeadlinePassed}
                  resolutionTimeLeft={resolutionTimeLeft}
                  onShowResolveModal={() => setShowResolveModal(true)}
                />
              </ComponentErrorBoundary>
            </div>
          )}

          {/* User Actions props */}
          <ComponentErrorBoundary>
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
              betId={numericBetId ? numericBetId.toString() : ''} // Pass numeric bet ID as string
              isNativeBet={isNativeBet} // Pass native bet flag
              creator={creator}

            />
          </ComponentErrorBoundary>
          {/* Resolve Modal */}
          {showResolveModal && options && (
            <ResolveModal
              isOpen={showResolveModal}
              betName={name}
              options={options}
              onResolve={handleResolveBet}
              onClose={() => setShowResolveModal(false)}
            />
          )}
        </div>
      </div>
    </PageErrorBoundary>
  )
}