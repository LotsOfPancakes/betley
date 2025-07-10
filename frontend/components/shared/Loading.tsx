// frontend/components/shared/Loading.tsx
'use client'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function Loading({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gray-900 flex items-center justify-center'
    : 'text-center py-12'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`animate-spin ${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4`}></div>
        <p className="text-white">{message}</p>
      </div>
    </div>
  )
}