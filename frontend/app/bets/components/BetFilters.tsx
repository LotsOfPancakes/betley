// frontend/app/bets/components/BetFilters.tsx
'use client'

import { FilterType } from '../types/bet.types'

interface BetFiltersProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'expired', label: 'Expired' }
]

export default function BetFilters({ currentFilter, onFilterChange }: BetFiltersProps) {
  return (
    <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentFilter === option.value
              ? 'bg-green-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}