'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState } from 'react'

// Import only the components we actually use
import { UserActions } from './components/UserActions'
import { BetOutcomes } from './components/BetOutcomes'
import { UnifiedBettingInterface } from './components/UnifiedBettingInterface'
import { CreatorActions } from './components/CreatorActions'
import { ResolveModal } from './components/ResolveModal'
import WhitelistModal from './components/WhitelistModal'
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'
import BackgroundElements from '@/app/components/BackgroundElements'
import { COLORS, DIMENSIONS, ANIMATIONS } from '@/lib/constants/ui'


// Import hooks
import { useBetDataNew } from './hooks/useBetDataNew'
import { useBetActionsNew } from './hooks/useBetActionsNew'
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag'

// Type definition for bet details array 
type BetDetailsArray = readonly [
  string,              // name
  readonly string[],   // options  
  `0x${string}`,      // creator
  bigint,             // endTime
  boolean,            // resolved
  number,             // winningOption
  readonly bigint[],  // totalAmounts
  `0x${string}`       // token address
]

// Error state for invalid IDs with bento styling
function InvalidBetError({ randomId }: { randomId: string }) {
  const router = useRouter()
  
  return (
    <div className={`min-h-screen ${COLORS.backgrounds.primary} flex items-center justify-center relative overflow-hidden`}>
      <BackgroundElements />
      
      {/* Error-specific red gradient orbs */}
      <div className={`absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full blur-3xl ${ANIMATIONS.pulse}`} />
      <div className={`absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-red-400/10 to-red-500/10 rounded-full blur-3xl ${ANIMATIONS.pulseDelay}`} />
      
      <div className="text-center relative z-10">
        <div className={`${COLORS.gradients.card} backdrop-blur-sm border border-red-500/20 ${DIMENSIONS.borderRadius.card} p-8`}>
          <div className={`w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full ${ANIMATIONS.spin} mx-auto mb-6`}></div>
          <h2 className={`text-2xl font-bold ${COLORS.text.primary} mb-4`}>Bet Not Found</h2>
          <p className={`${COLORS.text.secondary} mb-6`}>The bet with ID &ldquo;{randomId}&rdquo; doesn&apos;t exist or has been removed.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/bets')}
              className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 ${COLORS.text.primary} px-6 py-3 ${DIMENSIONS.borderRadius.input} font-semibold ${ANIMATIONS.transition} hover:scale-105 shadow-xl`}
            >
              Browse All Bets
            </button>
            <button
              onClick={() => router.push('/')}
              className={`bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 ${COLORS.text.primary} px-6 py-3 ${DIMENSIONS.borderRadius.input} font-semibold ${ANIMATIONS.transition} hover:scale-105 shadow-xl`}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface BetPageClientProps {
  id: string
}

export default function BetPageClient({ id }: BetPageClientProps) {
  const { address } = useAccount()
  const randomBetId = id
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showWhitelistModal, setShowWhitelistModal] = useState(false)

  // Get bet data using the new privacy-focused approach
  const {
    betDetails,
    userBets,
    ethBalance,
    allowance,
    decimals,
    hasClaimed,
    hasClaimedCreatorFees,
    isBetLoading,
    isNativeBet,
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed,
    isValidBetId,
    numericBetId,
    databaseBet
  } = useBetDataNew(randomBetId as string, { useReactQuery: true })

  // Extract bet data with proper typing - FIXED TypeScript issues
  const typedBetDetails = betDetails as BetDetailsArray | undefined
  const name = typedBetDetails?.[0]
  const options = typedBetDetails?.[1]
  const creator = typedBetDetails?.[2]
  const endTime = typedBetDetails?.[3]
  const resolved = typedBetDetails?.[4]
  const winningOption = typedBetDetails?.[5]
  const totalAmounts = typedBetDetails?.[6]

  // Get betting actions and state
  const {
    selectedOption,
    setSelectedOption,
    betAmount,
    setBetAmount,
    isApproving,
    isPending,
    justPlacedBet,
    handleApprove,
    handlePlaceBet,
    handleClaimWinnings,
    handleClaimRefund,
    handleClaimCreatorFees,
    handleResolveBet
  } = useBetActionsNew(numericBetId?.toString() || '0', typedBetDetails?.[7]) // betId as numeric string, token address

  // Feature flag checks - Default to BetOutcomes, use UserActions only if explicitly disabled
  const shouldUseUserActions = useFeatureFlag('useUserActions', databaseBet)
  const shouldUseBetOutcomes = !shouldUseUserActions

  // Loading state
  if (isBetLoading) {
    return (
      <div className={`min-h-screen ${COLORS.backgrounds.primary} flex items-center justify-center relative overflow-hidden`}>
        <BackgroundElements />
        
        <div className="text-center relative z-10">
          <div className={`${COLORS.gradients.card} backdrop-blur-sm ${COLORS.borders.card} ${DIMENSIONS.borderRadius.card} p-8`}>
            <div className={`w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full ${ANIMATIONS.spin} mx-auto mb-6`}></div>
            <p className={`${COLORS.text.secondary} text-lg`}>Loading bet...</p>
          </div>
        </div>
      </div>
    )
  }

  // Invalid bet ID
  if (!isValidBetId || !typedBetDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Calculate time values - KEEP ORIGINAL LOGIC
  const endTimeMs = endTime ? Number(endTime) * 1000 : 0
  const isActive = Date.now() < endTimeMs

  // Check if user has existing bet 
  const hasExistingBet = userBets && Array.isArray(userBets) ? 
    userBets.some((bet: bigint) => bet > BigInt(0)) : false

  return (
    <PageErrorBoundary>
      <div className={`min-h-screen ${COLORS.backgrounds.primary} relative overflow-hidden`}>
        <BackgroundElements />
        
        <div className="relative z-10 py-8">
          <div className={`${DIMENSIONS.maxWidth.cta} mx-auto px-4`}>
            {/* Back button */}
            <button
              onClick={() => window.history.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Main content */}
            <div className="space-y-5">
              {/* Main betting interface */}
              <ComponentErrorBoundary>
                <UnifiedBettingInterface
                  betId={randomBetId}
                  name={name || ''}
                  isPublic={databaseBet?.isPublic ?? false}
                  options={options as readonly string[] || []}
                  userBets={userBets as readonly bigint[] || []}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  betAmount={betAmount}
                  setBetAmount={setBetAmount}
                  needsApproval={allowance ? (allowance as bigint) < BigInt(betAmount || '0') : false}
                  isApproving={isApproving}
                  isPending={isPending}
                  handleApprove={handleApprove}
                  handlePlaceBet={handlePlaceBet}
                  totalAmounts={totalAmounts as readonly bigint[] || []}
                  decimals={Number(decimals) || 18}
                  ethBalance={ethBalance as bigint || BigInt(0)}
                  justPlacedBet={justPlacedBet}
                  hasExistingBet={hasExistingBet}
                  isNativeBet={isNativeBet || false}
                  isActive={isActive}
                  resolved={resolved || false}
                  winningOption={winningOption}
                  timeLeft={timeLeft}
                  resolutionTimeLeft={resolutionTimeLeft}
                  resolutionDeadlinePassed={resolutionDeadlinePassed}
                  endTime={endTime}
                  createdAt={databaseBet?.createdAt}
                  address={address}
                  creator={creator || ''}
                  onResolveEarly={() => setShowResolveModal(true)}
                  onManageWhitelist={() => setShowWhitelistModal(true)}
                />
              </ComponentErrorBoundary>

              {/* Creator Actions - Show resolve button when bet time expires */}
              <ComponentErrorBoundary>
                <CreatorActions
                  address={address}
                  creator={creator || ''}
                  timeLeft={timeLeft}
                  resolved={resolved || false}
                  resolutionDeadlinePassed={resolutionDeadlinePassed}
                  resolutionTimeLeft={resolutionTimeLeft}
                  onShowResolveModal={() => setShowResolveModal(true)}
                />
              </ComponentErrorBoundary>

              {/* User Actions - Conditional rendering based on feature flags */}
              <ComponentErrorBoundary>
                {shouldUseBetOutcomes ? (
                  <BetOutcomes
                    address={address}
                    resolved={resolved || false}
                    winningOption={winningOption}
                    userBets={userBets as readonly bigint[] || []}
                    totalAmounts={totalAmounts as readonly bigint[] || []}
                    resolutionDeadlinePassed={resolutionDeadlinePassed}
                    hasClaimed={Boolean(hasClaimed)}
                    hasClaimedCreatorFees={Boolean(hasClaimedCreatorFees)}
                    creator={creator || ''}
                    handleClaimWinnings={handleClaimWinnings}
                    handleClaimRefund={handleClaimRefund}
                    handleClaimCreatorFees={handleClaimCreatorFees}
                    decimals={Number(decimals) || 18}
                    isPending={isPending}
                    betId={numericBetId?.toString() || '0'}
                    isNativeBet={isNativeBet || false}
                  />
                ) : (
                  <UserActions
                    address={address}
                    resolved={resolved || false}
                    winningOption={winningOption}
                    userBets={userBets as readonly bigint[] || []}
                    totalAmounts={totalAmounts as readonly bigint[] || []}
                    resolutionDeadlinePassed={resolutionDeadlinePassed}
                    hasClaimed={Boolean(hasClaimed)}
                    hasClaimedCreatorFees={Boolean(hasClaimedCreatorFees)}

                    decimals={Number(decimals) || 18}
                    isPending={isPending}
                    handleClaimWinnings={handleClaimWinnings}
                    handleClaimRefund={handleClaimRefund}
                    handleClaimCreatorFees={handleClaimCreatorFees}
                    betId={numericBetId?.toString() || '0'}
                    isNativeBet={isNativeBet || false}
                    tokenAddress={typedBetDetails?.[7]}

                    creator={creator || ''}
                  />
                )}
              </ComponentErrorBoundary>
            </div>
          </div>
        </div>
        
        {/* Resolve Modal */}
        {showResolveModal && (
          <ResolveModal
            isOpen={showResolveModal}
            onClose={() => setShowResolveModal(false)}
            onResolve={async (winningOptionIndex: number) => {
              await handleResolveBet(winningOptionIndex)
              setShowResolveModal(false)
            }}
            betName={name || ''}
            options={options as readonly string[] || []}
            totalAmounts={totalAmounts as readonly bigint[] || []}
          />
        )}

        {/* Whitelist Modal */}
        {showWhitelistModal && (
          <WhitelistModal
            isOpen={showWhitelistModal}
            onClose={() => setShowWhitelistModal(false)}
            betId={randomBetId}
            contractBetId={numericBetId || 0}
          />
        )}
      </div>
    </PageErrorBoundary>
  )
}