// frontend/app/bets/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import BackgroundElements from '@/app/components/BackgroundElements'
import BetCard from './components/BetCard'
import BetFilters from './components/BetFilters'
import EmptyState from './components/EmptyState'
import PublicBetCard from './components/PublicBetCard' 
import BetsSearchLoading from './components/BetsSearchLoading'
import { useBetsListDatabase } from './hooks/useBetsListV2'
import { useBetsFiltering } from './hooks/useBetsFiltering'
import { usePublicBets } from '@/lib/hooks/usePublicBets'
import { COLORS, DIMENSIONS, ANIMATIONS, SHADOWS } from '@/lib/constants/ui'

type TabType = 'my' | 'public'

// ✅ NEW: Public bet interface (different from BetDetails)
interface PublicBet {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: string
  isPublic: boolean
  endTime: string // NEW: Contract end time as string
  timeRemaining: string // NEW: Formatted time remaining
}



export default function BetsPage() {
  const router = useRouter()
  const { address } = useAccount()
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<TabType>('my')

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

  // Filter public bets to show only active ones (bets that haven't ended yet)
  const filteredPublicBets = useMemo(() => {
    if (!publicBetsData?.bets) return []
    
    return publicBetsData.bets.filter(bet => {
      const now = Date.now()
      const endTime = new Date(bet.endTime).getTime()
      // Show only bets that haven't ended yet (active bets)
      return endTime > now
    })
  }, [publicBetsData?.bets])

  // Determine what to show based on active tab
  const isInitialLoading = activeTab === 'my' ? myBetsLoading : publicBetsLoading
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

          {/* Connection check for My Bets */}
          {activeTab === 'my' && !address ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-white mb-4">Looking for your Bets?</h3>
                <p className="text-gray-300 mb-6">Connect your wallet to see your betting history</p>
                <div className="flex justify-center">
                  <appkit-button />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Error state */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                  <p className="text-red-300">{error}</p>
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
                    // Render My Bets (existing BetCard)
                    filteredMyBets.map((bet) => (
                      <BetCard key={bet.id} bet={bet} decimals={Number(decimals) || 18} />
                    ))
                  ) : (
                    // ✅ NEW: Render Public Bets (simplified cards)
                    filteredPublicBets.map((bet: PublicBet) => (
                      <PublicBetCard key={bet.randomId} bet={bet} />
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


