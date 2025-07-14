// app/bets/[id]/page.tsx - With resolve modal integration
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
import { BetLookupDebug } from './components/BetLookupDebug' // adjust path


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
  } = useBetData(isValidBetId ? numericBetId.toString() : '999999', { useReactQuery: true })

  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    isPending,
    isApproving,
    justPlacedBet,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleResolveBet
  } = useBetActions(isValidBetId ? numericBetId.toString() : '999999')

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

  // Error state for bets that definitely don't exist
  if (betError || !betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // ✅ FIXED: Remove unused 'endTime' variable by using placeholder
  // Contract returns: [name, options, creator, endTime, resolved, winningOption, totalAmounts]
  const [name, options, creator, , resolved, winningOption, totalAmounts] = betDetails || []
  //                                  ^ placeholder for endTime (unused)

  // Calculate derived state
  const isActive = timeLeft > 0 && !resolved

  // Handle resolve bet with modal
  const handleResolveBetWithModal = async (winningOptionIndex: number) => {
    await handleResolveBet(winningOptionIndex)
    // Modal will close automatically on success
    refreshAllData() // Refresh to show updated state
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header with balance */}
        <BetHeader 
          address={address}
          hypeBalance={hypeBalance}
          decimals={decimals}
          betUrlId={randomBetId as string}  // ← ADD THIS LINE
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

          {/* Creator actions */}
          <CreatorActions
            address={address}
            creator={creator}
            timeLeft={timeLeft}
            resolved={resolved}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            resolutionTimeLeft={resolutionTimeLeft}
            onShowResolveModal={() => setShowResolveModal(true)}
          />

          {/* User actions */}
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

          {/* Betting interface */}
          <BettingInterface
            isActive={isActive}
            address={address}
            options={options}
            userBets={userBets}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            needsApproval={allowance !== undefined && hypeBalance !== undefined && betAmount !== '' ? 
              allowance < parseUnits(betAmount, decimals || 18) : false}
            isApproving={isApproving}
            isPending={isPending}
            handleApprove={handleApprove}
            handlePlaceBet={handlePlaceBet}
            totalAmounts={totalAmounts}
            decimals={decimals}
            hypeBalance={hypeBalance}
            justPlacedBet={justPlacedBet}
          />

        </div>

        {/* Resolve Modal */}
        <ResolveModal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveBetWithModal}
          options={options}
          betName={name}
        />

      </div>
    </div>
  )
}