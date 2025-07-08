'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useConfig, useAccount } from 'wagmi'
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
  userRole: 'creator' | 'bettor' | 'both'
  userTotalBet: bigint
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

  const getRoleBadge = () => {
    switch (bet.userRole) {
      case 'creator':
        return <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Creator</span>
      case 'bettor':
        return <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Bettor</span>
      case 'both':
        return <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Creator & Bettor</span>
    }
  }

  const status = getStatus()
  const totalPool = bet.totalAmounts.reduce((a, b) => a + b, BigInt(0))

  return (
    <div 
      onClick={() => router.push(`/bets/${bet.id}`)}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{bet.name}</h3>
          {getRoleBadge()}
        </div>
        <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Total Pool:</span>
          <span className="font-semibold text-white">{formatUnits(totalPool, decimals)} HYPE</span>
        </div>
        
        {bet.userTotalBet > BigInt(0) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Your Bet:</span>
            <span className="font-semibold text-blue-400">{formatUnits(bet.userTotalBet, decimals)} HYPE</span>
          </div>
        )}

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

export default function MyBetsPage() {
  const router = useRouter()
  const config = useConfig()
  const { address } = useAccount()
  const [bets, setBets] = useState<BetDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'resolved'>('all')

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

  // Fetch wallet-specific bets
  useEffect(() => {
    async function fetchMyBets() {
      if (!address || betCounter === undefined || !decimals) return

      setLoading(true)
      const fetchedBets: BetDetails[] = []

      for (let i = 0; i < Number(betCounter); i++) {
        try {
          // Get bet details
          const betData = await readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetDetails',
            args: [BigInt(i)],
          })

          if (!betData) continue

          // Check if user has bet on this
          const userBets = await readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getUserBets',
            args: [BigInt(i), address],
          })

          const isCreator = betData[2].toLowerCase() === address.toLowerCase()
          const userTotalBet = userBets ? userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0)) : BigInt(0)
          const hasBet = userTotalBet > BigInt(0)

          // Only include if user is creator OR has placed a bet
          if (isCreator || hasBet) {
            let userRole: 'creator' | 'bettor' | 'both'
            if (isCreator && hasBet) userRole = 'both'
            else if (isCreator) userRole = 'creator'
            else userRole = 'bettor'

            fetchedBets.push({
              id: i,
              name: betData[0],
              options: betData[1],
              creator: betData[2],
              endTime: betData[3],
              resolved: betData[4],
              winningOption: betData[5],
              totalAmounts: betData[6],
              userRole,
              userTotalBet
            })
          }
        } catch (error) {
          console.error(`Error fetching bet ${i}:`, error)
        }
      }

      setBets(fetchedBets)
      setLoading(false)
    }

    fetchMyBets()
  }, [address, betCounter, decimals, config])

  const filteredBets = bets.filter(bet => {
    const now = Math.floor(Date.now() / 1000)
    const hasEnded = Number(bet.endTime) <= now

    switch (filter) {
      case 'active':
        return !hasEnded && !bet.resolved
      case 'pending':
        return hasEnded && !bet.resolved
      case 'resolved':
        return bet.resolved
      default:
        return true
    }
  })

  // Show connect wallet prompt if not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-24">
            <h1 className="text-4xl font-bold text-white mb-6">My Bets</h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to see bets you&apos;ve created or participated in
            </p>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Bets</h1>
            <p className="text-gray-400 mt-1">
              Bets you&apos;ve created or participated in ({filteredBets.length} total)
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Bet
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'pending', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f === 'pending' ? 'Pending Resolution' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-300">Loading your bets...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              {filter !== 'all' ? `No ${filter === 'pending' ? 'pending resolution' : filter} bets found` : "You haven't created or joined any bets yet"}
            </h3>
            <p className="text-gray-300 mb-6">
              {filter !== 'all' 
                ? `Try switching to a different filter or create a new bet`
                : `Create your first bet or ask a friend to share one with you`
              }
            </p>
            <button
              onClick={() => router.push('/setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Bet
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