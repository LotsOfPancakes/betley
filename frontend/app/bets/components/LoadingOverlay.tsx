// frontend/app/bets/components/LoadingOverlay.tsx
'use client'

import Image from 'next/image'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export default function LoadingOverlay({ 
  isVisible, 
  message = 'Betley is looking...' 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-40 flex items-start justify-center pt-4">
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 border border-green-500/30 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
        <div className="w-6 h-6 relative">
          <Image
            src="/images/betley-searching.png"
            alt="Loading"
            width={24}
            height={24}
            className="object-contain animate-pulse"
            style={{
              animation: 'pulse 2s infinite, float 3s ease-in-out infinite'
            }}
            priority={false}
            quality={90}
          />
        </div>
        <span className="text-green-300 text-sm font-medium">{message}</span>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  )
}