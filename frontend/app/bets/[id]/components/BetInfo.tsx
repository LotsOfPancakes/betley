interface BetInfoProps {
  name: string
  creator: string
  timeLeft: number
  isActive: boolean
  resolved: boolean
  winningOption?: number
  options?: readonly string[]
  resolutionTimeLeft: number
  resolutionDeadlinePassed: boolean
}

export function BetInfo({
  name,
  creator,
  timeLeft,
  isActive,
  resolved,
  winningOption,
  options,
  resolutionTimeLeft,
  resolutionDeadlinePassed
}: BetInfoProps) {
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-white">{name}</h2>
      
      <div className="mb-6 space-y-2">
        <p className="text-gray-400">
          Created by: {creator?.slice(0, 6)}...{creator?.slice(-4)}
        </p>
        <p className="text-gray-400">
          Time left: {timeLeft > 0 ? formatTimeRemaining(timeLeft) : 'Ended'}
        </p>
        
        {resolved && winningOption !== undefined && options && (
          <p className="text-green-400 font-semibold">
            Winner: {options[winningOption]}
          </p>
        )}

        {!resolved && timeLeft <= 0 && (
          <p className="text-yellow-400">
            Resolution deadline: {resolutionDeadlinePassed ? 'Passed' : formatTimeRemaining(resolutionTimeLeft)}
          </p>
        )}
      </div>
    </>
  )
}