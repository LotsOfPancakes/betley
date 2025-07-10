// frontend/app/bets/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

// Import our extracted components and hooks
import BetCard from './components/BetCard'
import BetFilters from './components/BetFilters'
import EmptyState from './components/EmptyState'
import { useBetsList } from './hooks/useBetsList'
import { useBetsFiltering } from './hooks/useBetsFiltering'

export default function MyBetsPage() {
  const router = useRouter()
  const { address } = useAccount()
  
  // Use our custom hooks
  const { bets, loading, error, decimals } = useBetsList()
  const { filter, setFilter, filteredBets } = useBetsFiltering(bets)

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-6">Connect your wallet to view your bets</p>
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Bets</h1>
          <button
            onClick={() => router.push('/setup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Bet
          </button>
        </div>

        {/* Filter tabs */}
        <BetFilters currentFilter={filter} onFilterChange={setFilter} />

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading your bets...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} decimals={decimals || 18} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}