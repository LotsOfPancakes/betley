// frontend/app/setup/components/DurationSelector.tsx
'use client'

interface Duration {
  hours: number
  minutes: number
}

interface DurationSelectorProps {
  duration: Duration
  onChange: (duration: Duration) => void
}

const quickPresets = [
  { label: '1h', hours: 1, minutes: 0 },
  { label: '6h', hours: 6, minutes: 0 },
  { label: '1d', hours: 24, minutes: 0 }
]

export default function DurationSelector({ duration, onChange }: DurationSelectorProps) {
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Betting Duration
      </label>
      
      {/* Manual input */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Hours</label>
          <input
            type="number"
            min="0"
            max="168"
            value={duration.hours}
            onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
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
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quick presets - BIGGER buttons */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Quick presets:</label>
        <div className="flex gap-3">
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPreset(preset)}
              className={`px-6 py-3 rounded-lg text-base font-medium transition-colors flex-1 ${
                duration.hours === preset.hours && duration.minutes === preset.minutes
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration summary */}
      {totalMinutes > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Total duration: {totalMinutes} minutes
          {totalMinutes >= 60 && ` (${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m)`}
        </p>
      )}
    </div>
  )
}