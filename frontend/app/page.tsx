'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import BetTitleInput from './components/BetTitleInput'

export default function HomePage() {
  const router = useRouter()
  const { address } = useAccount()
  const [betTitle, setBetTitle] = useState('')

  const handleCreateBet = () => {
    if (!betTitle.trim()) return
    
    // Navigate to setup page with title as URL parameter
    const encodedTitle = encodeURIComponent(betTitle.trim())
    router.push(`/setup?title=${encodedTitle}`)
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

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-lime-400 bg-clip-text text-transparent">
                  Betting,
                </span>
                <br />
                <span className="text-white"> Simplified</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Bet on anything. Share with friends. Win together.
              </p>
              
              {/* Bet Title Input*/}             
                  <BetTitleInput
                    value={betTitle}
                    onChange={setBetTitle}
                    onSubmit={handleCreateBet}
                    isConnected={!!address}
                  />
            </div>
          </div>
        </div>
        
        {/* How It Works Section - Bento Grid */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-black">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Create a Bet</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Define your bet terms & betting duration.
                    <br /><br />
                    Anyone can create a bet on any topic.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-black">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Place Bets</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Bet with HYPE on your preferred outcome.
                    <br /><br />
                    Betley&apos;s contracts ensure all funds are held securely until resolution.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-black">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Win & Claim</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Winners share the losing pool proportionally to their stake.
                    <br /><br />
                    Claim winnings directly to your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Bento Style */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    Trustless
                  </div>
                  <p className="text-gray-300">No intermediaries needed</p>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    Flexible
                  </div>
                  <p className="text-gray-300">Custom resolution deadline</p>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    Pari-mutuel
                  </div>
                  <p className="text-gray-300">Fair payout system</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Enhanced Bento Style */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-12 hover:border-green-400/40 transition-all duration-500 text-center">
              <h2 className="text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Got a Bet in mind?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Connect your wallet and create your first bet in minutes.
              </p>
              
              {!address ? (
                <div className="flex justify-center">
                  <div className="transform hover:scale-105 transition-transform">
                    <ConnectKitButton />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/setup')}
                  className="group bg-gradient-to-r from-green-500 to-emerald-500 px-10 py-4 rounded-2xl font-bold text-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-300 transform hover:scale-105 shadow-xl shadow-green-500/30 flex items-center gap-3 mx-auto"
                >
                  Create a Bet
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}