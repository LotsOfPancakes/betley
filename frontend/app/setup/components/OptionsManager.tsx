'use client'

interface OptionsManagerProps {
  options: string[]
  onChange: (options: string[]) => void
  maxOptions?: number
  minOptions?: number
  maxLength?: number
  error?: string
}

export default function OptionsManager({ 
  options, 
  onChange, 
  maxOptions = 4,
  minOptions = 2,
  maxLength = 50,
  error
}: OptionsManagerProps) {
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    onChange(newOptions)
  }

  const addOption = () => {
    if (options.length < maxOptions) {
      onChange([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > minOptions) {
      const newOptions = options.filter((_, i) => i !== index)
      onChange(newOptions)
    }
  }

  // Calculate validation states - removed enough/dupes/toolong
  const filledOptions = options.filter(opt => opt.trim().length > 0)
  // const hasEnoughOptions = filledOptions.length >= minOptions
  // const hasDuplicates = new Set(filledOptions.map(opt => opt.trim().toLowerCase())).size !== filledOptions.length
  // const tooLongOptions = filledOptions.filter(opt => opt.length > maxLength)
  
  // Check for duplicate detection per option
  const getDuplicateStatus = (index: number, value: string) => {
    if (!value.trim()) return null
    const trimmedValue = value.trim().toLowerCase()
    const duplicateCount = options.filter((opt, i) => 
      i !== index && opt.trim().toLowerCase() === trimmedValue
    ).length
    return duplicateCount > 0 ? 'duplicate' : null
  }

  const getOptionBorderColor = (index: number, value: string) => {
    if (value.length > maxLength) return 'border-red-500 focus:border-red-500'
    if (getDuplicateStatus(index, value) === 'duplicate') return 'border-yellow-500 focus:border-yellow-500'
    if (value.trim().length > 0) return 'border-green-500/50 focus:border-green-400'
    return 'border-green-500/30 focus:border-green-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Betting Options
        </label>
        <span className="text-sm text-gray-400">
          {filledOptions.length}/{maxOptions} options
        </span>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="relative group">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mt-2">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1} (e.g., "Yes", "No")`}
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-800/60 text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-300 backdrop-blur-sm border ${getOptionBorderColor(index, option)}`}
                  maxLength={maxLength}
                />
                
                {/* Status indicators */}
                <div className="absolute right-4 top-3">
                  {option.trim().length > 0 && getDuplicateStatus(index, option) !== 'duplicate' && option.length <= maxLength && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {getDuplicateStatus(index, option) === 'duplicate' && (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">!</span>
                    </div>
                  )}
                  {option.length > maxLength && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove button */}
              {options.length > minOptions && (
                <button
                  onClick={() => removeOption(index)}
                  className="flex-shrink-0 w-8 h-8 mt-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Individual option validation messages */}
            <div className="ml-11 mt-1">
              {getDuplicateStatus(index, option) === 'duplicate' && (
                <p className="text-yellow-400 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Duplicate option
                </p>
              )}
              {option.length > maxLength && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Too long ({option.length}/{maxLength})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      {options.length < maxOptions && (
        <button
          onClick={addOption}
          className="w-full mt-4 py-3 border-1 border-green-500/30 hover:border-green-400/50 rounded-xl text-green-400 hover:text-green-300 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-green-500/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Option ({options.length}/{maxOptions})
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
      
    </div>
  )
}