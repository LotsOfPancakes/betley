// frontend/app/bets/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { useBetIdMapping } from '@/lib/hooks/useBetIdMapping'

// Import only the components we actually use
import { CreatorActions } from './components/CreatorActions'
import { UserActions } from './components/UserActions'
import { UnifiedBettingInterface } from './components/UnifiedBettingInterface'
import { ResolveModal } from './components/ResolveModal'
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

// Import hooks
import { useBetData } from './hooks/useBetData'
import { useBetActions } from './hooks/useBetActions'

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

// Generate dynamic metadata function
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    // Await the params in Next.js 15
    const { id: randomId } = await params
    
    // Look up bet details from database
    const { data: mapping } = await supabase
      .from('bet_mappings')
      .select('bet_name, numeric_id')
      .eq('random_id', randomId)
      .single()

    if (!mapping) {
      // Fallback for invalid bet IDs
      return {
        title: 'Bet Not Found - Betley',
        description: 'This bet could not be found.',
        openGraph: {
          title: 'Bet Not Found - Betley',
          description: 'This bet could not be found.',
          images: ['/og-image.png'],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Bet Not Found - Betley',
          description: 'This bet could not be found.',
          images: ['/og-image.png'],
        }
      }
    }

    const betTitle = mapping.bet_name
    const betUrl = `https://www.betley.xyz/bets/${randomId}`
    
    // Create dynamic metadata with bet title
    return {
      title: `${betTitle} - Betley`,
      description: `Join the bet: "${betTitle}" on Betley, the easiest way to set up on-chain bets.`,
      
      openGraph: {
        title: betTitle,
        description: `Join this bet on Betley: "${betTitle}"`,
        type: 'website',
        url: betUrl,
        siteName: 'Betley',
        images: [
          {
            url: '/og-bet-image.png', // You can create a specific image for bets
            width: 1200,
            height: 630,
            alt: `Bet: ${betTitle}`,
          }
        ],
      },
      
      twitter: {
        card: 'summary_large_image',
        title: betTitle,
        description: `Join this bet on Betley: "${betTitle}"`,
        images: ['/og-bet-image.png'],
        creator: '@betleyxyz',
        site: '@betleyxyz',
      },
      
      // Additional metadata
      alternates: {
        canonical: betUrl
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // Fallback metadata on error
    return {
      title: 'Bet - Betley',
      description: 'Join this bet on Betley, the easiest way to set up on-chain bets.',
      openGraph: {
        title: 'Bet - Betley',
        description: 'Join this bet on Betley.',
        images: ['/og-image.png'],
      }
    }
  }
}

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
    hasClaimedCreatorFees,
    isBetLoading,
    isNativeBet,
    timeLeft,
    resolutionTimeLeft,
    resolutionDeadlinePassed
  } = useBetData(isValidBetId && numericBetId !== null ? numericBetId.toString() : '999999', { useReactQuery: true })

  // Extract bet data with proper typing - FIXED TypeScript issues
  const typedBetDetails = betDetails as BetDetailsArray | undefined
  const name = typedBetDetails?.[0]
  const options = typedBetDetails?.[1]
  const creator = typedBetDetails?.[2]
  const endTime = typedBetDetails?.[3]
  const resolved = typedBetDetails?.[4]
  const winningOption = typedBetDetails?.[5]
  const totalAmounts = typedBetDetails?.[6]
  const tokenAddress = typedBetDetails?.[7]

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
    tokenAddress || ''
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
  if (!isValidBetId || !typedBetDetails) {
    return <InvalidBetError randomId={randomBetId as string} />
  }

  // Check if user is creator
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()

  // Calculate time values - FIXED typing
  const endTimeMs = endTime ? Number(endTime) * 1000 : 0
  const isActive = Date.now() < endTimeMs

  // Check if user has existing bet - FIXED typing
  const hasExistingBet = userBets && Array.isArray(userBets) ? 
    userBets.some((bet: bigint) => bet > BigInt(0)) : false

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {/* Animated background */}
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
        
        <div className="relative z-10 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Back button */}
            <button
              onClick={() => window.history.back()}
              className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Main content */}
            <div className="space-y-6">
              {/* Main betting interface */}
              <ComponentErrorBoundary>
                <UnifiedBettingInterface
                  name={name || ''}
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
                  hypeBalance={hypeBalance as bigint || BigInt(0)}
                  justPlacedBet={justPlacedBet}
                  hasExistingBet={hasExistingBet}
                  isNativeBet={isNativeBet || false}
                  isActive={isActive}
                  resolved={resolved || false}
                  winningOption={winningOption}
                  timeLeft={timeLeft}
                  resolutionTimeLeft={resolutionTimeLeft}
                  resolutionDeadlinePassed={resolutionDeadlinePassed}
                  address={address}
                />
              </ComponentErrorBoundary>

              {/* Creator Actions - Only show if user is creator and bet needs resolution */}
              {isCreator && !isActive && !resolved && (
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
              )}

              {/* User Actions */}
              <ComponentErrorBoundary>
                <UserActions
                  address={address}
                  resolved={resolved || false}
                  winningOption={winningOption}
                  userBets={userBets as readonly bigint[] || []}
                  totalAmounts={totalAmounts as readonly bigint[] || []}
                  resolutionDeadlinePassed={resolutionDeadlinePassed}
                  hasClaimed={Boolean(hasClaimed)}
                  hasClaimedCreatorFees={Boolean(hasClaimedCreatorFees)} // NEW: Pass creator fee claim status
                  decimals={Number(decimals) || 18}
                  isPending={isPending}
                  handleClaimWinnings={handleClaimWinnings}
                  betId={numericBetId?.toString() || '0'}
                  isNativeBet={isNativeBet || false}
                  creator={creator || ''}
                />
              </ComponentErrorBoundary>
            </div>
          </div>
        </div>

        {/* Resolve Modal */}
        <ComponentErrorBoundary>
          <ResolveModal
            isOpen={showResolveModal}
            onClose={() => setShowResolveModal(false)}
            betName={name || ''}
            options={options as readonly string[] || []}
            onResolve={handleResolveBet}
          />
        </ComponentErrorBoundary>
      </div>
    </PageErrorBoundary>
  )
}