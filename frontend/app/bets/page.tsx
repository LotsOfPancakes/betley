// frontend/app/bets/page.tsx - Updated with custom search image using Next.js Image
'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import Image from 'next/image'

// Import our extracted components and hooks
import BetCard from './components/BetCard'
import BetFilters from './components/BetFilters'
import EmptyState from './components/EmptyState'
import { useBetsList } from './hooks/useBetsList'
import { useBetsFiltering } from './hooks/useBetsFiltering'

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
            priority={false} // Not critical for initial page load
            quality={90} // High quality for sharp rendering
          />
          <div 
            className="w-16 h-16 absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"
            style={{ zIndex: -1 }}
          />
        </div>
        <p className="text-white">Betley is looking around for your bets...</p>
      </div>
      
      {/* Custom CSS animations for this component only */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        /* Alternative animation options */
        @keyframes gentle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

export default function MyBetsPage() {
  const router = useRouter()
  const { address } = useAccount()
  
  // Use our custom hooks
  const { bets, loading, error, decimals } = useBetsList()
  const { filter, setFilter, filteredBets } = useBetsFiltering(bets)

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
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
              <ConnectKitButton />
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl md:text-4xl font-bold text-white">My Bets</h1>
            <button
              onClick={() => router.push('/setup')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-green-500/30"
            >
              Create New Bet
            </button>
          </div>

          {/* Filter tabs */}
          <BetFilters currentFilter={filter} onFilterChange={setFilter} />

          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Loading state - using custom BetsSearchLoading component */}
          {loading ? (
            <BetsSearchLoading />
          ) : filteredBets.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} decimals={Number(decimals) || 18} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}