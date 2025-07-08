'use client'

import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState } from 'react'

// Import optimized hooks
import { useBetData } from './hooks/useBetData'
import { useBetActions } from './hooks/useBetActions'

// Import components
import { BetHeader } from './components/BetHeader'
import { LoadingState } from './components/LoadingState'
import { ErrorState } from './components/ErrorState'
import { BetInfo } from './components/BetInfo'
import { BettingSummary } from './components/BettingSummary'
import { CreatorActions } from './components/CreatorActions'
import { ResolutionModal } from './components/ResolutionModal'
import { UserActions } from './components/UserActions'
import { BettingInterface } from './components/BettingInterface'

export default function BetPage() {
  const { id: betId } = useParams()
  const { address } = useAccount()
  const [showResolveModal, setShowResolveModal] = useState(false)

  // Use optimized hooks with manual refresh capability
  const {
    betDetails,
    userBets,
    hypeBalance,
    decimals,
    hasClaimed,
    resolutionDeadline,
    allowance,
    isBetLoading,
    betError,
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    refreshAllData
  } = useBetData(betId as string)

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
    optimisticUpdate,
    isOptimisticallyApproved,
    optimisticBet
  } = useBetActions(betId as string, betDetails, refreshAllData)

  // Loading state
  if (isBetLoading) {
    return <LoadingState betId={betId as string} />
  }

  // Error state with enhanced error checking
  if (betError || !betDetails) {
    return <ErrorState betId={betId as string} error={betError} />
  }

  // Derive values from betDetails
  const [name, options, creator, endTime, resolved, winningOption, totalAmounts] = betDetails
  const isActive = timeLeft > 0

  // Apply optimistic updates to display data
  let displayTotalAmounts = totalAmounts
  let displayUserBets = userBets
  let displayAllowance = allowance
  let displayResolved = resolved
  let displayWinningOption = winningOption

  // Apply optimistic bet update
  if (optimisticBet && address) {
    displayUserBets = [...(userBets || [])]
    displayTotalAmounts = [...totalAmounts]
    
    // Add optimistic bet amount
    if (displayUserBets[optimisticBet.option] !== undefined) {
      displayUserBets[optimisticBet.option] = (displayUserBets[optimisticBet.option] || BigInt(0)) + optimisticBet.amount
    }
    if (displayTotalAmounts[optimisticBet.option] !== undefined) {
      displayTotalAmounts[optimisticBet.option] = displayTotalAmounts[optimisticBet.option] + optimisticBet.amount
    }
  }

  // Apply optimistic approval
  if (isOptimisticallyApproved && decimals && betAmount) {
    try {
      displayAllowance = (allowance || BigInt(0)) + parseUnits(betAmount, decimals)
    } catch {
      // Ignore parsing errors
    }
  }

  // Apply optimistic resolution
  if (optimisticUpdate.type === 'resolution') {
    displayResolved = true
    displayWinningOption = optimisticUpdate.data.winningOption
  }

  // Enhanced error checking after all hooks
  if (!name || name.trim() === '' || !creator || creator === '0x0000000000000000000000000000000000000000') {
    return <ErrorState betId={betId as string} error={new Error("Bet does not exist")} />
  }

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
          
          {/* Bet information */}
          <BetInfo 
            name={name}
            creator={creator}
            timeLeft={timeLeft}
            isActive={isActive}
            resolved={displayResolved}
            winningOption={displayWinningOption}
            options={options}
            resolutionTimeLeft={resolutionTimeLeft}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
          />

          {/* Show optimistic update feedback */}
          {optimisticUpdate.type && (
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
            userBets={displayUserBets}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            allowance={displayAllowance}
            isApproving={isApproving}
            isPending={isPending}
            handleApprove={handleApprove}
            handlePlaceBet={handlePlaceBet}
            decimals={decimals}
            totalAmounts={displayTotalAmounts}
            timeLeft={timeLeft}
            resolved={displayResolved}
          />

          {/* Creator resolution actions */}
          <CreatorActions
            address={address}
            creator={creator}
            timeLeft={timeLeft}
            resolved={displayResolved}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            resolutionTimeLeft={resolutionTimeLeft}
            onShowResolveModal={() => setShowResolveModal(true)}
          />

          {/* User actions (claim winnings/refunds) */}
          <UserActions
            address={address}
            resolved={displayResolved}
            winningOption={displayWinningOption}
            userBets={displayUserBets}
            totalAmounts={displayTotalAmounts}
            resolutionDeadlinePassed={resolutionDeadlinePassed}
            hasClaimed={hasClaimed}
            decimals={decimals}
            isPending={isPending}
            handleClaimWinnings={handleClaimWinnings}
          />
        </div>
        
        {/* Betting summary table */}
        <BettingSummary
          totalAmounts={displayTotalAmounts}
          options={options}
          userBets={displayUserBets}
          decimals={decimals}
        />

        {/* Resolution modal */}
        {showResolveModal && (
          <ResolutionModal
            options={options || []}
            onClose={() => setShowResolveModal(false)}
            onResolve={(option) => {
              handleResolveBet(option)
              setShowResolveModal(false)
            }}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  )
}