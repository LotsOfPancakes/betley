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
        <label className="block text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
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

      {/* Custom Duration Input Fields */}
      <div className="mt-4 mb-2">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              ref={hoursInputRef}
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
      
      {/* Quick Presets + Custom */}
      <div className="grid grid-cols-3 gap-3">
        {/* Custom Option */}
        <button
          onClick={handleCustomClick}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
            isCustomSelected 
              ? 'border-green-500 bg-green-500/10 text-green-400' 
              : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
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
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
                isSelected 
                  ? 'border-green-500 bg-green-500/10 text-green-400' 
                  : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm leading-tight">{preset.label}</span>
                    {preset.isDefault && (
                      <span className="text-xs text-green-400 font-medium">Default</span>
                    )}
                  </div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </div>
                {isSelected && (
                  // <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  //   <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  //   </svg>
                  // </div>
                  <div></div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}