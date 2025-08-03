'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatEther } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { getTokenSymbol } from '@/lib/utils/tokenFormatting'

// Custom hook for fetching user stats
function useUserStats(address: string | undefined) {
  return useQuery({
    queryKey: ['userStats', address],
    queryFn: async () => {
      if (!address) throw new Error('No address')
      const response = await fetch(`/api/users/${address}/stats`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// GET Symbol for Native HYPE
const nativeTokenSymbol = getTokenSymbol(true)
// for ERC20 token (if we use it)
// const erc20TokenSymbol = getTokenSymbol(false)


// Utility functions
function formatHype(weiAmount: string): string {
  if (weiAmount === '0') return '0'
  const formatted = formatEther(BigInt(weiAmount))
  return parseFloat(formatted).toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  gradient: string
}

function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 shadow-sm hover:shadow-lg hover:border-gray-600/50 transition-all duration-200">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold shadow-sm`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{title}</div>
            {subtitle && (
              <div className="text-sm text-gray-400 mt-1">{subtitle}</div>
            )}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-right text-gray-300">{value}</h3>
      </div>
    </div>
  )
}

// Loading Component
function LoadingStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-700 animate-pulse"></div>
              <div className="text-right">
                <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mb-2"></div>
                <div className="h-4 w-12 bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Page Component
export default function UserStatsPage() {
  const { address } = useAccount()
  const { data: stats, isLoading, error } = useUserStats(address)

  // Simple wallet check - exactly like your existing pages
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden flex items-center justify-center">
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
        
        <div className="relative z-10 text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 backdrop-blur-sm border border-green-400/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Looking for Your Stats?</h2>
          {/* <p className="text-gray-300 mb-8">
            Connect your wallet to view your betting statistics and track your performance on Betley.
          </p> */}
            <div className="flex justify-center"> 
              <ConnectKitButton />
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
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gray-900/40 backdrop-blur-sm border-b border-gray-800/50">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-lime-400 bg-clip-text text-transparent">Your Stats</h1>
                <p className="text-gray-300 mt-2">Track your betting performance on Betley</p>
              </div>
              <div className="text-right">
                {/* <div className="text-sm text-gray-400">Wallet</div> */}
                <div className="font-mono text-sm text-gray-200 mt-1">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </div>
                {stats?.last_updated && (
                  <div className="text-xs text-gray-500 mt-1">
                    Updated {formatDate(stats.last_updated)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

                

        {/* Stats Grid */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isLoading && <LoadingStats />}
          
          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">⚠️ Failed to load stats</div>
              <div className="text-gray-400 text-sm">Please try refreshing the page</div>
              <div className="text-xs text-gray-500 mt-2">Error: {error.message}</div>
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                <StatCard
                  title="Bets Created"
                  value={stats.bets_created}
                  subtitle="Total bets you've made"
                  icon="🎯"
                  gradient="from-blue-500 to-blue-600"
                />
                
                <StatCard
                  title="Volume Generated"
                  value={`${formatHype(stats.total_volume_created)} ${nativeTokenSymbol}`}
                  // value={`${formatHype(stats.total_volume_created)} ${tokenSymbol}`} for ERC20 token symbol
                  subtitle="Others bet on your bets"
                  icon="💰"
                  gradient="from-green-500 to-green-600"
                />
                
                <StatCard
                  title="Personal Betting"
                  value={`${formatHype(stats.total_volume_bet)} ${nativeTokenSymbol}`}
                  subtitle="Your total wagered"
                  icon="🎲"
                  gradient="from-purple-500 to-purple-600"
                />
                
                <StatCard
                  title="Wallets Attracted"
                  value={stats.unique_wallets_attracted}
                  subtitle="Unique users you've engaged"
                  icon="👥"
                  gradient="from-orange-500 to-orange-600"
                />
              </div>

              {/* Empty state for new users */}
              {/* {stats.bets_created === 0 && (
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-3">🚀</div>
                  <h3 className="text-lg font-medium text-white mb-2">Stats are empty for now</h3>
                  <p className="text-gray-400 mb-6">Create your first bet to get started!</p>
                  <button 
                    onClick={() => window.location.href = '/setup'}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-6 py-3 rounded-xl font-medium hover:from-green-300 hover:to-emerald-400 transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/20"
                  >
                    Create Your First Bet
                  </button>
                </div>
              )} */}
            </>
          )}
        </div>
      </div>
    </div>
  )
}