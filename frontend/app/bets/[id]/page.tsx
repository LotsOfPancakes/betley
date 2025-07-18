// frontend/app/bets/[id]/page.tsx - Updated with bento-style design
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

// Error state for invalid IDs with bento styling
function InvalidBetError({ randomId }: { randomId: string }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="text-center max-w-md mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-red-500/30 rounded-3xl p-8 hover:border-red-400/50 transition-all duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Bet Not Found</h1>
          <p className="text-gray-300 mb-6 leading-relaxed">
            The bet ID &quot;<span className="font-mono text-green-400">{randomId}</span>&quot; was not found.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl hover:from-blue-400 hover:to-blue-500 hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/30"
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => router.push('/bets')}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-3 rounded-2xl hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-300"
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
    isNativeBet,
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

  // Get bet actions
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
  
  // Loading states with bento styling
  if (isLoadingMappings || isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* Animated background grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="text-center relative z-10">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-300 text-lg">Loading bet...</p>
          </div>
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
      <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
        {/* Animated background grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          
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

          {/* User Actions */}
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
              betId={numericBetId ? numericBetId.toString() : ''}
              isNativeBet={isNativeBet}
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