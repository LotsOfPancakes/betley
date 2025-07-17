// components/BetTitleInput.tsx
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
          placeholder="Will it rain in an hour?"
          className={`w-full px-6 py-4 pr-20 text-lg rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 transition-all duration-300 focus:outline-none ${
            isFocused || hasValue 
              ? 'border-blue-500 bg-gray-700' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          maxLength={maxLength}
        />
        
        {/* Animated Button/Arrow */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <button
            onClick={onSubmit}
            disabled={!hasValue}
            className={`flex items-center justify-center rounded-lg font-semibold transition-all duration-300 ${
              hasValue
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            } ${
              hasValue ? 'w-12 h-12' : 'w-24 h-12 px-4'
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
      
      {/* Helper text */}
      {/* <div className="mt-3 flex justify-between items-center text-sm">
        <p className="text-gray-400">
          {hasValue 
            ? `${isConnected ? 'Continue to options' : 'Connect wallet to continue'}`
            : 'Enter your bet title to get started'
          }
        </p>
        <p className="text-gray-500">
          {value.length}/{maxLength}
        </p>
      </div> */}
    </div>
  )
}