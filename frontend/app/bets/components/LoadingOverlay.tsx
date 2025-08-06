// frontend/app/bets/components/LoadingOverlay.tsx
'use client'

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
        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-green-300 text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}