'use client'

import { useRef, useState, useEffect } from 'react'

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

// Calculate duration until UTC midnight of selected date
const calculateDurationToUTCMidnight = (selectedDate: Date) => {
  const now = new Date()
  const targetMidnight = new Date(selectedDate)
  targetMidnight.setUTCHours(0, 0, 0, 0)
  
  // If selected date is today or in the past, use the next occurrence of that date
  if (targetMidnight.getTime() <= now.getTime()) {
    targetMidnight.setUTCDate(targetMidnight.getUTCDate() + 1)
  }
  
  const msUntilMidnight = targetMidnight.getTime() - now.getTime()
  const totalMinutes = Math.ceil(msUntilMidnight / (1000 * 60))
  
  const hours = Math.floor(Math.max(0, totalMinutes) / 60)
  const minutes = Math.max(0, totalMinutes) % 60
  
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
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  const handleHoursChange = (hours: number) => {
    onChange({ ...duration, hours: Math.max(0, Math.min(99999, hours)) })
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const calculatedDuration = calculateDurationToUTCMidnight(date)
    onChange(calculatedDuration)
    setShowDatePicker(false)
  }

  const handleClearDate = () => {
    setSelectedDate(null)
    setShowDatePicker(false)
    // Reset to default if no duration set
    const totalMinutes = duration.hours * 60 + duration.minutes
    if (totalMinutes === 0) {
      onChange({ hours: 1, minutes: 0 })
    }
    hoursInputRef.current?.select()
  }

  const handleCustomClick = () => {
    if (selectedDate) {
      // If date is selected, show date picker
      setShowDatePicker(!showDatePicker)
    } else {
      // If no date selected, toggle between date picker and manual input
      setShowDatePicker(!showDatePicker)
      if (!showDatePicker) {
        const totalMinutes = duration.hours * 60 + duration.minutes
        if (totalMinutes === 0) {
          onChange({ hours: 1, minutes: 0 })
        }
      }
    }
  }

  const totalMinutes = duration.hours * 60 + duration.minutes
  const isValid = totalMinutes > 0
  const isReasonable = totalMinutes >= 1 // At least 1 min
  const isTooLong = totalMinutes > 99999 * 60 // More than 99999 hours

  // Check if current duration matches any preset
  const isPresetSelected = (preset: { hours: number; minutes: number; isUTCMidnight?: boolean; isDefault?: boolean }) => {
    if (preset.isUTCMidnight) {
      // For UTC midnight preset, check if it matches the current calculated value
      const currentMidnightTime = getTimeUntilNextUTCMidnight()
      return duration.hours === currentMidnightTime.hours && duration.minutes === currentMidnightTime.minutes
    }
    return duration.hours === preset.hours && duration.minutes === preset.minutes
  }

  // Determine if custom should be selected (value is not 0, 1h, or 1d, or if date is selected)
  const isCustomSelected = selectedDate || (totalMinutes > 0 && !quickPresets.some(preset => isPresetSelected(preset)))

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Custom'
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

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
              max="99999"
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
        {/* Custom Option with Date Picker */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={handleCustomClick}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-102 ${
              isCustomSelected 
                ? 'border-gray-500 bg-gray-500/8 text-gray-300' 
                : 'border-gray-600/45 hover:border-gray-500/65 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-sm leading-tight mb-1">{formatSelectedDate()}</div>
                <div className="text-xs opacity-75 leading-relaxed">
                  {selectedDate 
                    ? `${calculateDurationToUTCMidnight(selectedDate).hours}h ${calculateDurationToUTCMidnight(selectedDate).minutes}m to midnight UTC`
                    : 'Select end date'
                  }
                </div>
              </div>
              <div className="text-gray-400 mt-1">
                {showDatePicker ? '▲' : '▼'}
              </div>
            </div>
          </button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 z-[9999] w-80 bg-gray-800/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 shadow-xl">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-white font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {/* Day Headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="text-center text-xs text-gray-400 p-2 font-medium">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date && (
                      <button
                        onClick={() => !isDateDisabled(date) && handleDateSelect(date)}
                        disabled={isDateDisabled(date)}
                        className={`w-full h-full text-sm rounded-md transition-all duration-200 ${
                          isDateSelected(date)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : isDateDisabled(date)
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Preview and Actions */}
              <div className="border-t border-gray-700/50 pt-3">
                {selectedDate && (
                  <div className="text-xs text-gray-400 mb-3">
                    <div>Selected: {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                    })}</div>
                    <div>Duration: {calculateDurationToUTCMidnight(selectedDate).hours}h {calculateDurationToUTCMidnight(selectedDate).minutes}m to midnight UTC</div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <button
                    onClick={handleClearDate}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-2 text-sm bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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
              <div className="flex items-start justify-between h-full">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-sm leading-tight mb-1 flex items-center gap-2">
                    {preset.label}
                    {preset.isDefault && (
                      <span className="text-xs text-green-400/80 font-medium bg-gray-700/80 px-2 py-0.5 rounded-md">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-75 leading-relaxed">{preset.description}</div>
                </div>

              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}