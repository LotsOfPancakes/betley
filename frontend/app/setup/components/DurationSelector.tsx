'use client'

import { useRef } from 'react'

interface Duration {
  hours: number
  minutes: number
}

interface DurationSelectorProps {
  duration: Duration
  onChange: (duration: Duration) => void
  error?: string
}

// Calculate duration until next UTC midnight (hours and minutes)
const getTimeUntilNextUTCMidnight = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime()
  const totalMinutes = Math.ceil(msUntilMidnight / (1000 * 60))
  
  // Ensure minimum 1 minute
  const safeMinutes = Math.max(1, totalMinutes)
  
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60
  
  return { hours, minutes }
}

const nextMidnightTime = getTimeUntilNextUTCMidnight()
const midnightLabel = `${nextMidnightTime.hours}h${nextMidnightTime.minutes > 0 ? ` ${nextMidnightTime.minutes}m` : ''}`

const quickPresets = [
  { label: '1h', hours: 1, minutes: 0, description: 'Quick Bet', isDefault: true },
  { label: midnightLabel, hours: nextMidnightTime.hours, minutes: nextMidnightTime.minutes, description: 'Until Next Day 0000 UTC', isUTCMidnight: true },
]

export default function DurationSelector({ duration, onChange, error }: DurationSelectorProps) {
  const hoursInputRef = useRef<HTMLInputElement>(null)

  const handleHoursChange = (hours: number) => {
    onChange({ ...duration, hours: Math.max(0, Math.min(168, hours)) })
  }

  const handleMinutesChange = (minutes: number) => {
    onChange({ ...duration, minutes: Math.max(0, Math.min(59, minutes)) })
  }

  const setPreset = (preset: { hours: number; minutes: number; isUTCMidnight?: boolean; isDefault?: boolean }) => {
    if (preset.isUTCMidnight) {
      // Recalculate time until next UTC midnight
      const timeUntilMidnight = getTimeUntilNextUTCMidnight()
      onChange(timeUntilMidnight)
    } else {
      onChange({ hours: preset.hours, minutes: preset.minutes })
    }
  }

  const handleCustomClick = () => {
    const totalMinutes = duration.hours * 60 + duration.minutes
    
    // If custom is already selected, do nothing (repeat clicks do nothing)
    if (isCustomSelected) {
      // Focus hours input for visual feedback
      hoursInputRef.current?.select()
      return
    }
    
    // If not selected and current value is 0, set default and focus
    if (totalMinutes === 0) {
      onChange({ hours: 1, minutes: 0 })
    }
    
    // Focus the hours input
    hoursInputRef.current?.select()
  }

  const totalMinutes = duration.hours * 60 + duration.minutes
  const isValid = totalMinutes > 0
  const isReasonable = totalMinutes >= 1 // At least 1 min
  const isTooLong = totalMinutes > 7 * 24 * 60 // More than 1 week

  // Check if current duration matches any preset
  const isPresetSelected = (preset: { hours: number; minutes: number; isUTCMidnight?: boolean; isDefault?: boolean }) => {
    if (preset.isUTCMidnight) {
      // For UTC midnight preset, check if it matches the current calculated value
      const currentMidnightTime = getTimeUntilNextUTCMidnight()
      return duration.hours === currentMidnightTime.hours && duration.minutes === currentMidnightTime.minutes
    }
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

  // const formatDuration = () => {
  //   if (totalMinutes === 0) return 'Not set'
  //   if (duration.hours === 0) return `${duration.minutes}m`
  //   if (duration.minutes === 0) return `${duration.hours}h`
  //   return `${duration.hours}h ${duration.minutes}m`
  // }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold text-gray-200">
          Bet Duration 
          {/* <span className="text-sm text-gray-400">
          ({formatDuration()}) </span> */}
        </label>
        <span className="text-sm text-gray-400">
          {isValid && isReasonable && !isTooLong && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </span>
      </div>

      {/* Custom Duration Input */}
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              ref={hoursInputRef}
              type="number"
              min="0"
              max="168"
              value={duration.hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 pr-16 rounded-xl bg-gray-800/60 text-white focus:outline-none focus:ring-0 transition-all duration-300 backdrop-blur-sm border ${getBorderColor()}`}
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
              Hours
            </span>
          </div>
          <div className="flex-1 relative">
            <input
              type="number"
              min="0"
              max="59"
              value={duration.minutes}
              onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 pr-20 rounded-xl bg-gray-800/60 text-white focus:outline-none focus:ring-0 transition-all duration-300 backdrop-blur-sm border ${getBorderColor()}`}
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
              Minutes
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Presets + Custom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Custom Option */}
        <button
          onClick={handleCustomClick}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-102 ${
            isCustomSelected 
              ? 'border-gray-500 bg-gray-500/8 text-gray-300' 
              : 'border-gray-600/45 hover:border-gray-500/65 text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">Custom</div>
              {/* <div className="text-xs opacity-75">Set custom time</div> */}
            </div>
            {isCustomSelected && (
              // <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              //   <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              //   </svg>
              // </div>
              <div></div>
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
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-102 ${
                isSelected 
                  ? 'border-gray-500 bg-gray-500/8 text-gray-300' 
                  : 'border-gray-600/45 hover:border-gray-500/65 text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative h-full">
                {preset.isDefault && (
                  <span className="absolute -top-2 -right-2 text-xs text-green-400/80 font-medium bg-gray-700/80 px-2 py-0.5 rounded-md z-10">
                    Default
                  </span>
                )}
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-sm leading-tight mb-1">{preset.label}</div>
                    <div className="text-xs opacity-75 leading-relaxed">{preset.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}