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
  resolutionTimeLeft,
  onShowResolveModal
}: CreatorActionsProps) {
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()
  const canResolve = isCreator && timeLeft <= 0 && !resolved && !resolutionDeadlinePassed

  if (!canResolve) return null

  return (
    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
      <p className="text-yellow-300 mb-3">As the creator, you can now resolve this bet:</p>
      <p className="text-sm text-yellow-200 mb-3">
        Time remaining: {formatTimeRemaining(resolutionTimeLeft)}
      </p>
      <button
        onClick={onShowResolveModal}
        className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
      >
        Resolve Bet
      </button>
    </div>
  )
}