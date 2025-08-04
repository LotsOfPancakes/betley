// frontend/app/bets/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
// AppKit buttons are web components - no import needed
import Image from 'next/image'

// Import our extracted components and hooks
import BetCard from './components/BetCard'
import BetFilters from './components/BetFilters'
import EmptyState from './components/EmptyState'
import PublicBetCard from './components/PublicBetCard' 
import { useBetsList } from './hooks/useBetsList'
import { useBetsFiltering } from './hooks/useBetsFiltering'
import { usePublicBets } from '@/lib/hooks/usePublicBets'

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

// Custom loading component specifically for bets search
function BetsSearchLoading() {
  return (
    <div className="text-center py-12">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <Image
            src="/images/betley-searching.png"
            alt="Searching for bets"
            width={64}
            height={64}
            className="object-contain animate-pulse"
            style={{
              animation: 'pulse 2s infinite, float 3s ease-in-out infinite'
            }}
            priority={false}
            quality={90}
          />
          <div 
            className="w-16 h-16 absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"
            style={{ zIndex: -1 }}
          />
        </div>
        <p className="text-white">Betley is looking around for bets...</p>
      </div>
    </div>
  )
}

export default function BetsPage() {
  const router = useRouter()
  const { address } = useAccount()  // REMOVE address since it's unused
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<TabType>('my')

  // My Bets (existing logic)
  const { bets: myBets, loading: myBetsLoading, error: myBetsError, decimals } = useBetsList()
  const { filter, setFilter, filteredBets: filteredMyBets } = useBetsFiltering(myBets)

  // Public Bets
  const { data: publicBetsData, isLoading: publicBetsLoading, error: publicBetsError } = usePublicBets({
    enabled: activeTab === 'public'
  })

  // Filter public bets by status (simplified - they don't have contract data yet)
  const filteredPublicBets = publicBetsData?.bets || []

  // Determine what to show based on active tab
  const isLoading = activeTab === 'my' ? myBetsLoading : publicBetsLoading
  const error = activeTab === 'my' ? myBetsError : publicBetsError?.message
  const hasNoBets = activeTab === 'my' ? filteredMyBets.length === 0 : filteredPublicBets.length === 0

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.2]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 left-32 w-96 h-96 bg-gradient-to-tr from-green-500/15 to-lime-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {activeTab === 'my' ? 'My Bets' : 'Public Bets'}
            </h1>
            <button
              onClick={() => router.push('/setup')}
              className="bg-gradient-to-r from-green-500/80 to-emerald-400/70 hover:from-green-400 hover:to-emerald-400 text-gray-100 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-green-500/30"
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
          <div className="text-center relative z-10">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <Image
              src="/images/betley-searching.png"
              alt="Searching for bets"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              style={{
                animation: 'pulse 2s infinite, float 3s ease-in-out infinite'
              }}
              priority={false} // Not critical for initial page load
              quality={90} // High quality for sharp rendering
            />
            </div>
              <h1 className="text-2xl font-bold text-white mb-4">Looking for your Bets?</h1>
              <div className="flex justify-center mb-4"> 
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
              {isLoading ? (
                <BetsSearchLoading />
              ) : hasNoBets ? (
                activeTab === 'my' ? (
                  <EmptyState filter={filter} />
                ) : (
                  // Custom empty state for public bets
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      No public bets found
                    </h3>
                    <p className="text-gray-300 mb-6">
                      There are currently no public bets available. Check back later or create your own!
                    </p>
                    <button
                      onClick={() => router.push('/setup')}
                      className="bg-gradient-to-r from-green-500/80 to-emerald-400/70 hover:from-green-400 hover:to-emerald-400 text-gray-100 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-green-500/30"
                    >
                      Create Public Bet
                    </button>
                  </div>
                )
              ) : (
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  )
}


