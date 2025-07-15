// frontend/app/setup/components/BetNameInput.tsx
'use client'

interface BetNameInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  error?: string
  isValid?: boolean
}

export default function BetNameInput({ 
  value, 
  onChange, 
  maxLength = 100,
  error
}: BetNameInputProps) {
  // Calculate validation state
  const isTooShort = value.length > 0 && value.length < 5
  const isGoodLength = value.length >= 5 && value.length <= maxLength
  const isNearLimit = value.length > maxLength * 0.8
  
  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return 'border-2 border-red-500 focus:border-red-500'
    if (isTooShort) return 'border-2 border-yellow-500 focus:border-yellow-500'
    return 'border border-gray-600 focus:border-blue-500'
  }

  // Get helpful suggestions
  const getSuggestion = () => {
    // Removed initial suggestion for empty state - keep it clean
    if (isTooShort) return `Add ${5 - value.length} more characters to make it descriptive`
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Bet Title
        </label>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Will it rain tomorrow?"
          className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${getBorderColor()}`}
          maxLength={maxLength}
        />
        
        {/* Status indicator - restored green tick for consistency */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isGoodLength && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {isTooShort && (
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
      </div>

      {/* Character count and status */}
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs">
          {getSuggestion() && (
            <p className={`${
              error ? 'text-red-400' : 
              isTooShort ? 'text-yellow-400' : 
              'text-gray-400'
            }`}>
              💡 {getSuggestion()}
            </p>
          )}
        </div>
        <p className={`text-xs ${isNearLimit ? 'text-yellow-400' : 'text-gray-400'}`}>
          {value.length}/{maxLength}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}