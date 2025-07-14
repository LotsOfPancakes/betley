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
  const canResolve = isCreator && timeLeft <= 0 && !resolved && !resolutionDeadlinePassed

  if (!canResolve) return null

  return (
    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
      <p className="text-yellow-300 mb-3">As the creator, you can now:</p>
      <button
        onClick={onShowResolveModal}
        className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
      >
        Resolve Bet
      </button>
    </div>
  )
}