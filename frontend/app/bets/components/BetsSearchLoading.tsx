// frontend/app/bets/components/BetsSearchLoading.tsx
'use client'

import Image from 'next/image'

interface BetsSearchLoadingProps {
  variant?: 'initial' | 'refetch' | 'retry' | 'auth'
  retryAttempt?: number
  maxRetries?: number
  customMessage?: string
  customSubtitle?: string
}

export default function BetsSearchLoading({ 
  variant = 'initial', 
  retryAttempt = 0, 
  maxRetries = 5,
  customMessage,
  customSubtitle
}: BetsSearchLoadingProps) {
  const getLoadingMessage = () => {
    if (customMessage) return customMessage
    
    switch (variant) {
      case 'refetch':
        return 'Betley is looking for updates...'
      case 'retry':
        return `Betley is still looking... (${retryAttempt}/${maxRetries})`
      case 'auth':
        return 'Betley is looking around for bets, but...'
      default:
        return 'Betley is looking around for bets...'
    }
  }

  const getImageAnimation = () => {
    switch (variant) {
      case 'refetch':
        return 'animate-spin'
      case 'retry':
        return 'animate-bounce'
      case 'auth':
        return 'animate-pulse'
      default:
        return 'animate-pulse'
    }
  }

  const getContainerSize = () => {
    return variant === 'refetch' ? 'max-w-sm' : 'max-w-md'
  }

  return (
    <div className="text-center py-12">
      <div className={`bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 ${getContainerSize()} mx-auto`}>
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <Image
            src="/images/betley-searching.png"
            alt="Loading bets"
            width={64}
            height={64}
            className={`object-contain ${getImageAnimation()}`}
            style={{
              animation: (variant === 'initial' || variant === 'auth')
                ? 'pulse 2s infinite, float 3s ease-in-out infinite'
                : undefined
            }}
            priority={false}
            quality={90}
          />
          <div 
            className="w-16 h-16 absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"
            style={{ zIndex: -1 }}
          />
        </div>
        <p className="text-white">{getLoadingMessage()}</p>
        
        {(variant === 'auth' || customSubtitle) && (
          <p className="text-gray-400 text-sm mt-2">
            {customSubtitle || 'Please sign in your wallet to give Betley permissions to look for your bets'}
          </p>
        )}
        
        {variant === 'retry' && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(retryAttempt / maxRetries) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}