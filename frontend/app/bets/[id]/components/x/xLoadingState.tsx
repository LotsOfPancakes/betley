import { BETLEY_ADDRESS } from '@/lib/contractABI'

interface LoadingStateProps {
  betId: string
}

export function LoadingState({ betId }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4 text-white">Loading bet #{betId}...</p>
        <p className="text-gray-300">Make sure bet exists and contract is deployed correctly</p>
        <p className="text-sm text-gray-400 mt-2">Contract: {BETLEY_ADDRESS}</p>
      </div>
    </div>
  )
}