// frontend/app/bets/[id]/components/CreatorActions.tsx
'use client'

interface CreatorActionsProps {
  address?: string
  creator: string
  timeLeft: number
  resolved: boolean
  resolutionDeadlinePassed: boolean
  resolutionTimeLeft: number
  onShowResolveModal: () => void
}

export function CreatorActions({
  address,
  creator,
  timeLeft,
  resolved,
  resolutionDeadlinePassed,
  onShowResolveModal
}: CreatorActionsProps) {
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()
  
  // Show for regular resolution: creator + betting period ended + not resolved + resolution deadline not passed
  const canResolve = isCreator && timeLeft <= 0 && !resolved && !resolutionDeadlinePassed

  if (!canResolve) return null

  return (
    <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/40 rounded-3xl p-6">
      <p className="text-yellow-300 mb-3">Betting period has ended. As the creator, you can now:</p>
      <button
        onClick={onShowResolveModal}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-yellow-500/30"
      >
        Resolve Bet
      </button>
    </div>
  )
}