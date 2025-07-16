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
          description: 'You have no completed bets'
        }
      default:
        return {
          title: "You haven't created or joined any bets yet",
          description: 'Create your first bet or ask a friend!'
        }
    }
  }

  const message = getEmptyMessage()

  return (
    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">
        {message.title}
      </h3>
      <p className="text-gray-300 mb-6">
        {message.description}
      </p>
      <button
        onClick={() => router.push('/setup')}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        {filter === 'all' ? 'Create Your First Bet' : 'Create New Bet'}
      </button>
    </div>
  )
}