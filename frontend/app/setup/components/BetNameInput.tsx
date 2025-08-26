'use client'

interface BetNameInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  error?: string
  isValid?: boolean
  isPreFilled?: boolean
}

export default function BetNameInput({ 
  value, 
  onChange, 
  maxLength = 100,
  error,
  isPreFilled = false
}: BetNameInputProps) {
  // Calculate validation state
  const isTooShort = value.length > 0 && value.length < 5
  const isGoodLength = value.length >= 5 && value.length <= maxLength
  // const isNearLimit = value.length > maxLength * 0.8 //no need for this anymore
  
  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return 'border-1 border-red-500 focus:border-red-500'
    if (value.length === 0) return 'border-1 border-yellow-500 focus:border-yellow-500'
    if (isTooShort) return 'border-1 border-yellow-500 focus:border-yellow-500'
    if (isGoodLength) return 'border-1 border-green-500 focus:border-green-500'
    return 'border-1 border-green-500/30 focus:border-green-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold text-gray-200">
          Bet Title
        </label>
        <span className="text-sm text-gray-400">
          {isGoodLength && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Will it rain tomorrow?"
          className={`w-full px-6 py-3 rounded-2xl bg-gray-800/60 text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-300 text-lg backdrop-blur-sm ${getBorderColor()}`}
          maxLength={maxLength}
        />
      </div>

      {/* Character count */}
      <div className="mt-2 flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          {isTooShort && (
            <span className="text-yellow-400">⚠️ Add {5 - value.length} more characters to make it descriptive</span>
          )}
        </div>
      </div>
    </div>
  )
}