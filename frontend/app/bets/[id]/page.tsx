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
  } = useBetData(isValidBetId ? numericBetId.toString() : '999999') // Use impossible ID for invalid cases

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

  // Loading state
  if (isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4 text-white">Loading bet...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (betError || !betDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Extract bet details (matching the contract's getBetDetails return structure)
  const [name, options, creator, startTime, endTime, resolved, winningOption, totalAmounts] = betDetails

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
            allowance={allowance}
            isApproving={isApproving}
            isPending={isPending}
            handleApprove={handleApprove}
            handlePlaceBet={handlePlaceBet}
            decimals={decimals}
            totalAmounts={totalAmounts}
            timeLeft={timeLeft}
            resolved={resolved}
          />

          {/* Creator actions for resolution */}
          <CreatorActions
            address={address}
            creator={creator}
            timeLeft={timeLeft}
            resolved={resolved}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            resolutionTimeLeft={resolutionTimeLeft}
            onShowResolveModal={() => setShowResolveModal(true)}
          />

          {/* User actions for claiming winnings/refunds */}
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

          {/* Share section */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">📤 Share This Private Bet</h3>
            <p className="text-blue-200 text-sm mb-3">
              Share this link to let others participate:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded focus:outline-none font-mono"
              />
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied!')
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Simple Resolution Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Resolve Bet</h3>
              <p className="text-gray-300 mb-4">Select the winning option:</p>
              
              <div className="space-y-2 mb-6">
                {options?.map((option, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                    <input
                      type="radio"
                      name="winner"
                      onChange={() => setSelectedOption(index)}
                      className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 focus:ring-blue-500"
                    />
                    <span className="text-white">{option}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedOption !== null) {
                      handleResolveBet()
                      setShowResolveModal(false)
                    }
                  }}
                  disabled={isPending || selectedOption === null}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600"
                >
                  {isPending ? 'Resolving...' : 'Resolve'}
                </button>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}