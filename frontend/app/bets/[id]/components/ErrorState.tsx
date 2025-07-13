import { BETLEY_ADDRESS } from '@/lib/contractABI'

interface ErrorStateProps {
  betId: string
  error?: Error | string | null
}

export function ErrorState({ 
  betId, 
  error 
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-red-400 mb-4">Error loading bet #{betId}</p>
        <p className="text-gray-300">This bet might not exist yet.</p>
        <p className="text-sm text-gray-400 mt-4">Contract: {BETLEY_ADDRESS}</p>
        {error && (
          <p className="text-sm text-red-400 mt-2">
            Error: {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </div>
    </div>
  )
}