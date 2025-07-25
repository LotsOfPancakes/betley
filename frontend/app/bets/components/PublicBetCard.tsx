// frontend/app/bets/components/PublicBetCard.tsx
'use client'

import Link from 'next/link'

// ✅ UPDATED: Match the interface used in the main page
interface PublicBet {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: string
  isPublic: boolean
}

interface PublicBetCardProps {
  bet: PublicBet
}

export default function PublicBetCard({ bet }: PublicBetCardProps) {
  const betUrl = `/bets/${bet.randomId}`
  
//   // Format creator address (show first 6 and last 4 characters)
//   const formatAddress = (address: string) => {
//     if (address.length < 10) return address
//     return `${address.slice(0, 6)}...${address.slice(-4)}`
//   }

//   // Format date
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
//     if (diffInHours < 1) return 'Just now'
//     if (diffInHours < 24) return `${diffInHours}h ago`
//     if (diffInHours < 48) return 'Yesterday'
//     return date.toLocaleDateString()
//   }

  return (
    <Link href={betUrl} className="block group">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02]">
        {/* Public Badge */}
        {bet.isPublic && (
          <div className="flex items-center gap-1 text-sm text-green-400 mb-3">
            <span>🌍 Public</span>
          </div>
        )}

        {/* Bet Name */}
        <h3 className="font-semibold text-white text-lg mb-3 line-clamp-2 group-hover:text-green-400 transition-colors">
          {bet.name}
        </h3>

        {/* Creator Info */}
        {/* <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span>Creator: {formatAddress(bet.creator)}</span>
          </div>
        </div> */}

        {/* Created Date */}
        {/* <div className="text-xs text-gray-500">
          Created {formatDate(bet.createdAt)}
        </div> */}

        {/* Call to Action */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Created by {bet.creator.slice(0, 4)}...{bet.creator.slice(-4)}</span>
            <span className="text-green-400 group-hover:translate-x-1 transition-transform">Join Bet →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}