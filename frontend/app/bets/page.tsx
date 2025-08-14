// frontend/app/bets/page.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import BackgroundElements from '@/app/components/BackgroundElements'
import BetCard from './components/BetCard'
import BetFilters from './components/BetFilters'
import EmptyState from './components/EmptyState'
import BetsSearchLoading from './components/BetsSearchLoading'
import { useBetsListDatabase } from './hooks/useBetsListV2'
import { useBetsFiltering } from './hooks/useBetsFiltering'
import { usePublicBets } from '@/lib/hooks/usePublicBets'
import { COLORS, DIMENSIONS, ANIMATIONS, SHADOWS } from '@/lib/constants/ui'
import { useWalletAuth } from '@/lib/auth/WalletAuthContext'

type TabType = 'my' | 'public'

// ✅ UNIFIED: Import unified bet types
import type { PublicBet } from './types/bet.types'



export default function BetsPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { isAuthenticated, authenticate, isInitialized, isAuthenticating } = useWalletAuth()
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<TabType>('my')

  // Handle authentication requirement for My Bets tab
  React.useEffect(() => {
    // Only proceed if context is initialized and we're on My Bets tab
    if (activeTab !== 'my' || !isInitialized || !address || isAuthenticating) {
      return
    }

    if (!isAuthenticated) {
      // Direct authentication - wallet signature request will handle the UI
      authenticate()
      // No need for modal fallback - user can retry from error state if needed
    }
  }, [activeTab, address, isAuthenticated, isInitialized, isAuthenticating, authenticate])

  // My Bets (database-first approach - Phase 2)
  const { 
    bets: myBets, 
    loading: myBetsLoading, 
    fetching: myBetsFetching, 
    error: myBetsError, 
    decimals,
    retryAttempt: myBetsRetryAttempt
  } = useBetsListDatabase()
  const { filter, setFilter, filteredBets: filteredMyBets } = useBetsFiltering(myBets)

  // Public Bets
  const { 
    data: publicBetsData, 
    isLoading: publicBetsLoading, 
    isFetching: publicBetsFetching,
    error: publicBetsError,
    failureCount: publicBetsRetryAttempt
  } = usePublicBets({
    enabled: activeTab === 'public'
  })

  // Public bets are already filtered for active bets by the API
  const filteredPublicBets = useMemo(() => {
    return publicBetsData?.bets || []
  }, [publicBetsData?.bets])

  // Determine what to show based on active tab
  const isInitialLoading = activeTab === 'my' 
    ? (myBetsLoading || !isInitialized || (address && !isAuthenticated && isAuthenticating))
    : publicBetsLoading
  const isFetching = activeTab === 'my' ? myBetsFetching : publicBetsFetching
  const error = activeTab === 'my' ? myBetsError : publicBetsError?.message
  const retryAttempt = activeTab === 'my' ? myBetsRetryAttempt : publicBetsRetryAttempt
  const hasNoBets = activeTab === 'my' ? filteredMyBets.length === 0 : filteredPublicBets.length === 0
  const hasExistingData = activeTab === 'my' ? myBets.length > 0 : (publicBetsData?.bets?.length || 0) > 0

  return (
    <div className={`min-h-screen ${COLORS.backgrounds.primary} ${COLORS.text.primary} relative overflow-hidden`}>
      <BackgroundElements />
      
      <div className="relative z-10 py-12">
        <div className={`${DIMENSIONS.maxWidth.content} mx-auto px-4`}>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold ${COLORS.text.primary}`}>
              {activeTab === 'my' ? 'My Bets' : 'Public Bets'}
            </h1>
            <button
              onClick={() => router.push('/setup')}
              className={`${COLORS.gradients.brandButton} ${COLORS.gradients.brandButtonHover} text-white px-6 py-3 ${DIMENSIONS.borderRadius.input} font-semibold ${ANIMATIONS.transition} hover:scale-105 ${SHADOWS.glow.button}`}
            >
              Create New Bet
            </button>
          </div>

          {/* ✅ NEW: Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              My Bets
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'public'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Public
            </button>
          </div>

          {/* Status filters (only show for My Bets) */}
          {activeTab === 'my' && (
            <BetFilters currentFilter={filter} onFilterChange={setFilter} />
          )}

          {/* Connection and Authentication check for My Bets */}
          {activeTab === 'my' && !address ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-white mb-4">Looking for your Bets?</h3>
                <div className="flex justify-center">
                  <appkit-button />
                </div>
              </div>
            </div>
          ) : activeTab === 'my' && address && !isAuthenticated && isAuthenticating ? (
            <BetsSearchLoading variant="auth" />
          ) : (
            <>
              {/* Error state */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                  <p className="text-red-300">{error}</p>
                  {error.includes('Authentication') && (
                    <button
                      onClick={() => authenticate()}
                      className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-400 hover:to-emerald-500 transition-all duration-300"
                    >
                      Sign Message to Access Bets
                    </button>
                  )}
                </div>
              )}

              {/* Loading state */}
              {isInitialLoading ? (
                <BetsSearchLoading 
                  variant={retryAttempt > 0 ? 'retry' : 'initial'}
                  retryAttempt={retryAttempt}
                  maxRetries={5}
                />
              ) : hasNoBets ? (
                activeTab === 'my' ? (
                  <EmptyState filter={filter} />
                ) : (
                  // Custom empty state for public bets
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      No Public Bets found
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Check back later or create your own!
                    </p>
                    <button
                      onClick={() => router.push('/setup')}
                      className={`${COLORS.gradients.brandButton} ${COLORS.gradients.brandButtonHover} text-white px-6 py-3 ${DIMENSIONS.borderRadius.input} font-semibold ${ANIMATIONS.transition} hover:scale-105 ${SHADOWS.glow.button}`}
                    >
                      Create Public Bet
                    </button>
                  </div>
                )
              ) : (
                <div className="relative">
                  {/* Background refresh loading - consistent with initial load */}
                  {isFetching && hasExistingData && (
                    <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-40 flex items-center justify-center">
                      <BetsSearchLoading variant="refetch" />
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTab === 'my' ? (
                    // Render My Bets (private bets with user data)
                    filteredMyBets.map((bet) => (
                      <BetCard 
                        key={bet.id} 
                        bet={bet} 
                        decimals={Number(decimals) || 18}
                        variant="private"
                      />
                    ))
                  ) : (
                    // ✅ UNIFIED: Render Public Bets using same BetCard component
                    filteredPublicBets.map((bet: PublicBet) => (
                      <BetCard 
                        key={bet.randomId} 
                        bet={bet} 
                        decimals={18} // Default decimals for public bets
                        variant="public"
                      />
                    ))
                  )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


