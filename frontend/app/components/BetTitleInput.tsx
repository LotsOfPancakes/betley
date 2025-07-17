'use client'

import { useState } from 'react'

interface BetTitleInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isConnected: boolean
}

export default function BetTitleInput({ 
  value, 
  onChange, 
  onSubmit, 
}: BetTitleInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  const hasValue = value.trim().length > 0
  const maxLength = 100
  
  // Clip text at max length
  const handleChange = (newValue: string) => {
    if (newValue.length <= maxLength) {
      onChange(newValue)
    } else {
      onChange(newValue.slice(0, maxLength))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasValue) {
      onSubmit()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative">
        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? "Will Elvis arrive on time for Townhall?" : "What are you betting on today?"}
          className={`w-full px-6 py-4 pr-20 text-lg rounded-2xl bg-gray-800/65 text-white transition-all duration-300 focus:outline-none backdrop-blur-sm ${
            isFocused || hasValue 
              ? 'bg-gray-800/80 placeholder-gray-500' 
              : 'hover:border-green-500/50 placeholder-gray-400'
          }`}
          style={{
            boxShadow: isFocused || hasValue 
              ? '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 0 100px rgba(34, 197, 94, 0.1)' 
              : 'none'
          }}
          maxLength={maxLength}
        />
        
        {/* Animated Button/Arrow */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <button
            onClick={onSubmit}
            disabled={!hasValue}
            className={`flex items-center justify-center rounded-xl font-semibold transition-all duration-300 transform ${
              hasValue
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white cursor-pointer hover:scale-105 shadow-lg shadow-green-500/25'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            } ${
              hasValue ? 'w-18 h-12' : 'w-30 h-12 px-4'
            }`}
          >
            {hasValue ? (
              // Arrow icon
              <svg 
                className="w-6 h-6 transform transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            ) : (
              // "Create Bet" text
              <span className="text-sm whitespace-nowrap">Create Bet</span>
            )}
          </button>
        </div>
      </div>      
    </div>
  )
}