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
  { label: '1d', hours: 24, minutes: 0, description: 'Full day' },
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
  const isReasonable = totalMinutes >= 1 // At least 1 min
  const isTooLong = totalMinutes > 7 * 24 * 60 // More than 1 week

  // Check if current duration matches any preset
  const isPresetSelected = (preset: { hours: number; minutes: number }) => {
    return duration.hours === preset.hours && duration.minutes === preset.minutes
  }

  // Determine if custom should be selected (value is not 0, 1h, or 1d)
  const isCustomSelected = totalMinutes > 0 && !quickPresets.some(preset => isPresetSelected(preset))

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:border-red-500'
    if (isValid && isReasonable && !isTooLong) return 'border-green-500/50 focus:border-green-400'
    if (totalMinutes > 0 && totalMinutes < 1) return 'border-yellow-500 focus:border-yellow-500'
    if (totalMinutes === 0) return 'border-yellow-500 focus:border-yellow-500'
    return 'border-green-500/30 focus:border-green-400'
  }

  const formatDuration = () => {
    if (totalMinutes === 0) return 'Not set'
    if (duration.hours === 0) return `${duration.minutes}m`
    if (duration.minutes === 0) return `${duration.hours}h`
    return `${duration.hours}h ${duration.minutes}m`
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Betting Duration <span className="text-sm text-gray-400">
          ({formatDuration()}) </span>
        </label>
        <span className="text-sm text-gray-400">
          {isValid && isReasonable && !isTooLong && (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {totalMinutes > 0 && (totalMinutes < 10 || isTooLong) && (
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
        </span>
      </div>

      {/* Quick Presets + Custom */}
      <div className="grid grid-cols-3 gap-3">
        {/* Custom Option */}
        <button
          onClick={() => {
            // If custom is already selected, do nothing
            // If not selected and current value is 0, set to 2h as default
            if (!isCustomSelected && totalMinutes === 0) {
              onChange({ hours: 2, minutes: 0 })
            }
          }}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
            isCustomSelected 
              ? 'border-green-500 bg-green-500/10 text-green-400' 
              : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">Custom</div>
              <div className="text-xs opacity-75">Set custom time</div>
            </div>
            {isCustomSelected && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* Preset Options */}
        {quickPresets.map((preset) => {
          const isSelected = isPresetSelected(preset)
          return (
            <button
              key={preset.label}
              onClick={() => setPreset(preset)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
                isSelected 
                  ? 'border-green-500 bg-green-500/10 text-green-400' 
                  : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{preset.label}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom Duration Inputs */}
      <div className="mt-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="168"
              value={duration.hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 rounded-xl bg-gray-800/60 text-white focus:outline-none focus:ring-0 transition-all duration-300 backdrop-blur-sm border ${getBorderColor()}`}
            />
            <label className="block text-xs text-gray-400 p-1">Hours</label>
          </div>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="59"
              value={duration.minutes}
              onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 rounded-xl bg-gray-800/60 text-white focus:outline-none focus:ring-0 transition-all duration-300 backdrop-blur-sm border ${getBorderColor()}`}
            />
            <label className="block text-xs text-gray-400 p-1">Minutes</label>
          </div>
        </div>
      </div>
    </div>
  )
}