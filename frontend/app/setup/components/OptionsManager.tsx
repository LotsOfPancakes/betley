// frontend/app/setup/components/OptionsManager.tsx
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

  // Calculate validation states
  const filledOptions = options.filter(opt => opt.trim().length > 0)
  const hasEnoughOptions = filledOptions.length >= minOptions
  const hasDuplicates = new Set(filledOptions.map(opt => opt.trim().toLowerCase())).size !== filledOptions.length
  const tooLongOptions = filledOptions.filter(opt => opt.length > maxLength)
  
  // Check for duplicate detection per option
  const getDuplicateStatus = (index: number, value: string) => {
    if (!value.trim()) return null
    const trimmedValue = value.trim().toLowerCase()
    const duplicateCount = options.filter((opt, i) => 
      i !== index && opt.trim().toLowerCase() === trimmedValue
    ).length
    return duplicateCount > 0 ? 'duplicate' : 'unique'
  }

  // Get border color for each option
  const getOptionBorderColor = (index: number, value: string) => {
    const duplicateStatus = getDuplicateStatus(index, value)
    if (duplicateStatus === 'duplicate') return 'border-red-500 focus:border-red-500'
    if (value.trim() && duplicateStatus === 'unique') return 'border-green-500 focus:border-green-500'
    if (value.length > maxLength) return 'border-yellow-500 focus:border-yellow-500'
    return 'border-gray-600 focus:border-blue-500'
  }

  const getStatusMessage = () => {
    if (filledOptions.length < minOptions) {
      return 'Enter at least two bet options'
    }
    if (hasDuplicates) {
      return 'Remove duplicate options - each option must be unique'
    }
    if (tooLongOptions.length > 0) {
      return 'Some options are too long - keep them under 50 characters'
    }
    return ''
  }

  const getStatusColor = () => {
    if (hasEnoughOptions && !hasDuplicates && tooLongOptions.length === 0) return 'text-green-400'
    if (hasDuplicates || tooLongOptions.length > 0) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Betting Options ({minOptions} - {maxOptions} options)
        </label>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const duplicateStatus = getDuplicateStatus(index, option)
          const isOptional = index >= minOptions
          
          return (
            <div key={index} className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}${isOptional ? ' (optional)' : ''}`}
                    className={`w-full px-4 py-3 pr-10 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none transition-colors ${getOptionBorderColor(index, option)}`}
                    maxLength={maxLength}
                  />
                  
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {duplicateStatus === 'unique' && option.trim() && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {duplicateStatus === 'duplicate' && (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {options.length > minOptions && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                    title="Remove this option"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Individual option feedback */}
              {option.length > maxLength && (
                <p className="text-yellow-400 text-xs mt-1">Too long ({option.length}/{maxLength})</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Status message - UPDATED: Only shows when there are validation issues */}
      {getStatusMessage() && (
        <div className="mt-3">
          <p className={`text-xs ${getStatusColor()}`}>
            💡 {getStatusMessage()}
          </p>
        </div>
      )}

      {/* Add option button */}
      {options.length < maxOptions && (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
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