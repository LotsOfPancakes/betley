// frontend/app/setup/components/DurationSelector.tsx
'use client'

interface Duration {
  hours: number
  minutes: number
}

interface DurationSelectorProps {
  duration: Duration
  onChange: (duration: Duration) => void
  error?: string
}

const quickPresets = [
  { label: '1h', hours: 1, minutes: 0, description: 'Quick decision' },
  { label: '6h', hours: 6, minutes: 0, description: 'Half day' },
  { label: '1d', hours: 24, minutes: 0, description: 'Full day' },
  { label: '3d', hours: 72, minutes: 0, description: 'Weekend' }
]

export default function DurationSelector({ duration, onChange, error }: DurationSelectorProps) {
  const handleHoursChange = (hours: number) => {
    onChange({ ...duration, hours: Math.max(0, Math.min(168, hours)) })
  }

  const handleMinutesChange = (minutes: number) => {
    onChange({ ...duration, minutes: Math.max(0, Math.min(59, minutes)) })
  }

  const setPreset = (preset: { hours: number; minutes: number }) => {
    onChange(preset)
  }

  const totalMinutes = duration.hours * 60 + duration.minutes
  const isValid = totalMinutes > 0
  const isReasonable = totalMinutes >= 60 // At least 1 hour
  const isTooLong = totalMinutes > 7 * 24 * 60 // More than 1 week

  // Get duration description
  // const getDurationDescription = () => {
  //   if (totalMinutes === 0) return 'Set a duration for your bet'
  //   if (totalMinutes < 60) return `Very short - only ${totalMinutes} minutes`
  //   if (totalMinutes < 24 * 60) return `${Math.floor(totalMinutes / 60)} hours`
  //   const days = Math.floor(totalMinutes / (24 * 60))
  //   const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60)
  //   return `${days} day${days === 1 ? '' : 's'}${remainingHours > 0 ? ` and ${remainingHours} hour${remainingHours === 1 ? '' : 's'}` : ''}`
  // }

  // Get recommendation
  // const getRecommendation = () => {
  //   if (totalMinutes === 0) return 'Choose how long people can place bets'
  //   if (totalMinutes < 30) return 'Very short - consider at least 1 hour for people to participate'
  //   if (totalMinutes < 60) return 'Short duration - good for quick decisions'
  //   if (totalMinutes <= 24 * 60) return 'Good duration for most bets'
  //   if (totalMinutes <= 7 * 24 * 60) return 'Long duration - gives everyone time to participate'
  //   return 'Very long duration - consider if this is necessary'
  // }

  // const getStatusColor = () => {
  //   if (totalMinutes === 0) return 'text-gray-400'
  //   if (totalMinutes < 30) return 'text-yellow-400'
  //   if (isReasonable && !isTooLong) return 'text-green-400'
  //   if (isTooLong) return 'text-yellow-400'
  //   return 'text-blue-400'
  // }

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:border-red-500'
    if (isValid && isReasonable && !isTooLong) return 'border-green-500 focus:border-green-500'
    if (totalMinutes > 0 && totalMinutes < 30) return 'border-yellow-500 focus:border-yellow-500'
    return 'border-gray-600 focus:border-blue-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Betting Duration
        </label>
        {/* Removed "Good duration" text - visual feedback is sufficient */}
      </div>
      
      {/* Manual input - reverted to two fields for better UX */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Hours</label>
          <input
            type="number"
            min="0"
            max="168"
            value={duration.hours}
            onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-0 transition-all duration-200 ${getBorderColor()}`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Minutes</label>
          <input
            type="number"
            min="0"
            max="59"
            value={duration.minutes}
            onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-0 transition-all duration-200 ${getBorderColor()}`}
          />
        </div>
        
        {/* Status indicator - centered vertically with the input fields */}
        <div className="flex items-center justify-center w-12 pt-6">
          {isValid && isReasonable && !isTooLong && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {totalMinutes > 0 && (totalMinutes < 30 || isTooLong) && (
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick presets - removed "Popular choices:" label */}
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickPresets.map((preset) => {
            const isSelected = duration.hours === preset.hours && duration.minutes === preset.minutes
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPreset(preset)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                }`}
                title={preset.description}
              >
                <div className="font-semibold">{preset.label}</div>
                <div className="text-xs opacity-75">{preset.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Duration summary and feedback */}
      <div className="space-y-2">
        {/* Show error for insufficient duration */}
        {totalMinutes < 1 && (
          <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm">
              ⚠️ Bet must run for at least 1 minute!
            </p>
          </div>
        )}
        
        {/* Removed blue explanation section - keep interface minimal */}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}