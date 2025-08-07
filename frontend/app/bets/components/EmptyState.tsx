// frontend/app/bets/components/EmptyState.tsx
'use client'

import { useRouter } from 'next/navigation'
import { FilterType } from '../types/bet.types'

interface EmptyStateProps {
  filter: FilterType
}

export default function EmptyState({ filter }: EmptyStateProps) {
  const router = useRouter()

  const getEmptyMessage = () => {
    switch (filter) {
      case 'active':
        return {
          title: 'No active bets found',
          description: 'You have no bets that are currently accepting wagers'
        }
      case 'pending':
        return {
          title: 'No pending resolution bets found',
          description: 'You have no bets waiting to be resolved'
        }
      case 'resolved':
        return {
          title: 'No resolved bets found',
          description: 'You have no completed bets or refunds available'
        }
      case 'expired':
        return {
          title: 'No expired bets found',
          description: 'You have no bets that expired without participants'
        }
      default:
        return {
          title: "It's a little empty here",
          description: 'Create your first bet or ask a friend!'
        }
    }
  }

  const message = getEmptyMessage()

  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-white mb-4">
        {message.title}
      </h3>
      <p className="text-gray-300 mb-6">
        {message.description}
      </p>
      <button
        onClick={() => router.push('/setup')}
        className="bg-gradient-to-r from-green-500/80 to-emerald-400/70 hover:from-green-400 hover:to-emerald-400 text-gray-100 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-green-500/30"
      >
        {filter === 'all' ? 'Create Your First Bet' : 'Create New Bet'}
      </button>
    </div>
  )
}