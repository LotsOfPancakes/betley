'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { useRouter } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { BETLEY_ABI, BETLEY_ADDRESS, ERC20_ABI, HYPE_TOKEN_ADDRESS } from '@/lib/contractABI'

interface BetDetails {
  id: number
  name: string
  options: readonly string[]
  creator: string
  endTime: bigint
  resolved: boolean
  winningOption: number
  totalAmounts: readonly bigint[]
  resolutionDeadline?: bigint
}

function BetCard({ bet, decimals }: { bet: BetDetails; decimals: number }) {
  const router = useRouter()
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = Number(bet.endTime) - now
  const hasEnded = timeLeft <= 0

  const getStatus = () => {
    if (bet.resolved) return { text: 'Resolved', color: 'text-green-400' }
    if (hasEnded) return { text: 'Pending Resolution', color: 'text-yellow-400' }
    return { text: 'Active', color: 'text-blue-400' }
  }

  const status = getStatus()
  const totalPool = bet.totalAmounts.reduce((a, b) => a + b, BigInt(0))

  return (
    <div 
      onClick={() => router.push(`/bets/${bet.id}`)}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">{bet.name}</h3>
        <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-300">
          Total Pool: <span className="font-semibold text-white">{formatUnits(totalPool, decimals)} HYPE</span>
        </div>

        <div className="space-y-2">
          {bet.options.map((option, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{option}</span>
              <span className="text-white">{formatUnits(bet.totalAmounts[index], decimals)} HYPE</span>
            </div>
          ))}
        </div>

        {!hasEnded && (
          <div className="text-sm text-gray-400">
            Time left: {Math.floor(timeLeft / 3600)}h {Math.floor((timeLeft % 3600) / 60)}m
          </div>
        )}

        {bet.resolved && (
          <div className="text-sm text-green-400">
            Winner: {bet.options[bet.winningOption]}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BetsListPage() {
  const router = useRouter()
  const config = useConfig()
  const [bets, setBets] = useState<BetDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'resolved'>('all')

  // Read total number of bets
  const { data: betCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  // Fetch all bet details
  useEffect(() => {
    async function fetchBets() {
      if (betCounter === undefined || !decimals) return

      setLoading(true)
      const fetchedBets: BetDetails[] = []

      for (let i = 0; i < Number(betCounter); i++) {
        try {
          const betData = await readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetDetails',
            args: [BigInt(i)],
          })

          if (betData) {
            fetchedBets.push({
              id: i,
              name: betData[0],
              options: betData[1],
              creator: betData[2],
              endTime: betData[3],
              resolved: betData[4],
              winningOption: betData[5],
              totalAmounts: betData[6],
            })
          }
        } catch (error) {
          console.error(`Error fetching bet ${i}:`, error)
        }
      }

      setBets(fetchedBets)
      setLoading(false)
    }

    fetchBets()
  }, [betCounter, decimals, config])

  const filteredBets = bets.filter(bet => {
    const now = Math.floor(Date.now() / 1000)
    const hasEnded = Number(bet.endTime) <= now

    switch (filter) {
      case 'active':
        return !hasEnded && !bet.resolved
      case 'ended':
        return hasEnded && !bet.resolved
      case 'resolved':
        return bet.resolved
      default:
        return true
    }
  })

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">All Bets</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Bet
            </button>
            <ConnectKitButton />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'ended', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-300">Loading bets...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-300 mb-4">No {filter !== 'all' ? filter : ''} bets found</p>
            <button
              onClick={() => router.push('/setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create the first bet
            </button>
          </div>
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