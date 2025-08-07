// frontend/app/bets/components/LoadingOverlay.tsx
'use client'

import Image from 'next/image'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  showButton?: boolean
  buttonComponent?: React.ReactNode
}

export default function LoadingOverlay({ 
  isVisible, 
  message = 'Betley is looking...', 
  showButton = false,
  buttonComponent 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="text-center relative z-10">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <Image
              src="/images/betley-searching.png"
              alt="Loading"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              style={{
                animation: 'pulse 2s infinite, float 3s ease-in-out infinite'
              }}
              priority={false}
              quality={90}
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{message}</h1>
          {showButton && buttonComponent && (
            <div className="flex justify-center mb-4">
              {buttonComponent}
            </div>
          )}
        </div>
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