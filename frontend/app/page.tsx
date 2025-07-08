'use client'

import { useRouter } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'

export default function HomePage() {
  const router = useRouter()
  const { address } = useAccount()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Decentralized Betting, 
              <span className="text-blue-500"> Simplified</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Create and participate in trustless bets on HyperEVM. 
              Pari-mutuel style payouts ensure fair distribution of winnings.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/setup')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create a Bet
              </button>
              <button
                onClick={() => router.push('/bets')}
                className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
              >
                Browse Bets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create a Bet</h3>
              <p className="text-gray-300">
                Define your bet terms, set up to 3 options, and specify the betting duration. 
                Anyone can create a bet on any topic.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Place Your Bets</h3>
              <p className="text-gray-300">
                Bet with HYPE tokens on your preferred outcome. 
                Smart contracts ensure all funds are held securely until resolution.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Win & Claim</h3>
              <p className="text-gray-300">
                Winners share the losing pool proportionally to their stake. 
                Claim your winnings directly to your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-500">Trustless</p>
              <p className="text-gray-300 mt-2">No intermediaries needed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-500">72 Hours</p>
              <p className="text-gray-300 mt-2">Resolution deadline</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-500">Pari-mutuel</p>
              <p className="text-gray-300 mt-2">Fair payout system</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Betting?</h2>
          <p className="text-gray-300 mb-8">
            Connect your wallet and create your first bet in minutes.
          </p>
          {!address ? (
            <ConnectKitButton />
          ) : (
            <button
              onClick={() => router.push('/setup')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Bet
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built on HyperEVM • Powered by HYPE tokens
          </p>
        </div>
      </footer>
    </div>
  )
}