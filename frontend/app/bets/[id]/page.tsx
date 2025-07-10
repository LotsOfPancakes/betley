// frontend/app/bets/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { useBetIdMapping } from '@/lib/hooks/useBetIdMapping'

// Import existing components
import { BetHeader } from './components/BetHeader'
import { BetInfo } from './components/BetInfo'
import { CreatorActions } from './components/CreatorActions'
import { UserActions } from './components/UserActions'
import { BettingInterface } from './components/BettingInterface'
import { BetCreationPending } from './components/BetCreationPending'

// Import hooks
import { useBetData } from './hooks/useBetData'
import { useBetActions } from './hooks/useBetActions'

// Simple error state for invalid IDs
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
              onClick={() => router.push('/bets')}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View My Bets
            </button>
            <button
              onClick={() => router.push('/setup')}
              className="w-full bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Create New Bet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BetPage() {
  const { id: randomBetId } = useParams()
  const { address } = useAccount()
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [isLoadingMappings, setIsLoadingMappings] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const { getNumericId, mappings } = useBetIdMapping()

  // Convert random ID to numeric ID
  const numericBetId = getNumericId(randomBetId as string)
  const isValidBetId = numericBetId !== null

  // Wait for mappings to load before showing error
  useEffect(() => {
    // Small delay to ensure localStorage has been read
    const timer = setTimeout(() => {
      setIsLoadingMappings(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [mappings])

  // ALWAYS call hooks - use null/undefined values for invalid IDs
  const {
    betDetails,
    userBets,
    hypeBalance,
    decimals,
    hasClaimed,
    allowance,
    isBetLoading,
    betError,
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    refreshAllData
  } = useBetData(isValidBetId ? numericBetId.toString() : '999999')

  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    isPending,
    isApproving,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet,
    optimisticUpdate
  } = useBetActions(isValidBetId ? numericBetId.toString() : '999999', betDetails, refreshAllData)

  // Auto-retry logic for newly created bets
  useEffect(() => {
    if (isValidBetId && betError && retryCount < 10) {
      const timer = setTimeout(() => {
        console.log(`Retrying to load bet data... attempt ${retryCount + 1}`)
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
          <p className="text-xl mb-4 text-white">Loading bet...</p>
        </div>
      </div>
    )
  }

  // Error state for bets that definitely don't exist
  if (betError || !betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Debug logging
console.log('Raw betDetails from contract:', betDetails)
console.log('betDetails length:', betDetails?.length)

// Contract returns: [name, options, creator, endTime, resolved, winningOption, totalAmounts]
const [name, options, creator, endTime, resolved, winningOption, totalAmounts] = betDetails || []

console.log('Extracted totalAmounts:', totalAmounts)
console.log('All extracted values:', { name, options: options?.length, creator, endTime, resolved, winningOption, totalAmounts: totalAmounts?.length })

  // Calculate derived state
  const isActive = timeLeft > 0 && !resolved

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header with balance */}
        <BetHeader 
          address={address}
          hypeBalance={hypeBalance}
          decimals={decimals}
        />
        
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          
          {/* Privacy indicator */}
          <div className="flex justify-between items-center mb-4">
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded text-sm font-medium">
              🔒 Private Bet
            </span>
            <span className="text-gray-500 text-sm font-mono">
              ID: {randomBetId}
            </span>
          </div>

          {/* Bet information */}
          <BetInfo 
            name={name}
            creator={creator}
            timeLeft={timeLeft}
            isActive={isActive}
            resolved={resolved}
            winningOption={winningOption}
            options={options}
            resolutionTimeLeft={resolutionTimeLeft}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            totalAmounts={totalAmounts}
            decimals={decimals}
          />

          {/* Show optimistic update feedback */}
          {optimisticUpdate?.type && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
              <p className="text-blue-300 text-sm">
                {optimisticUpdate.type === 'approval' && '⏳ Approving tokens...'}
                {optimisticUpdate.type === 'bet' && '⏳ Placing your bet...'}
                {optimisticUpdate.type === 'resolution' && '⏳ Resolving bet...'}
              </p>
            </div>
          )}

          {/* Betting interface for active bets */}
          <BettingInterface
            isActive={isActive}
            address={address}
            options={options}
            userBets={userBets}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            needsApproval={allowance !== undefined && betAmount && decimals ? 
              allowance < BigInt(Math.floor(parseFloat(betAmount || '0') * Math.pow(10, decimals))) : false}
            isApproving={isApproving}
            isPending={isPending}
            handleApprove={handleApprove}
            handlePlaceBet={handlePlaceBet}
            totalAmounts={totalAmounts}
            decimals={decimals}
            hypeBalance={hypeBalance}
          />

          {/* Creator actions */}
          <CreatorActions
            address={address}
            creator={creator}
            isActive={isActive}
            resolved={resolved}
            resolutionTimeLeft={resolutionTimeLeft}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            options={options}
            showResolveModal={showResolveModal}
            setShowResolveModal={setShowResolveModal}
            handleResolveBet={handleResolveBet}
            isPending={isPending}
          />

          {/* User actions */}
          <UserActions
            address={address}
            creator={creator}
            resolved={resolved}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            userBets={userBets}
            winningOption={winningOption}
            hasClaimed={hasClaimed}
            handleClaimWinnings={handleClaimWinnings}
            isPending={isPending}
            decimals={decimals}
          />
        </div>
      </div>
    </div>
  )
}