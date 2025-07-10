// frontend/app/setup/components/OptionsManager.tsx
'use client'

interface OptionsManagerProps {
  options: string[]
  onChange: (options: string[]) => void
  maxOptions?: number
  minOptions?: number
  maxLength?: number
}

export default function OptionsManager({ 
  options, 
  onChange, 
  maxOptions = 4,
  minOptions = 2,
  maxLength = 50
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Betting Options ({minOptions}-{maxOptions} options)
      </label>
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              maxLength={maxLength}
            />
            {options.length > minOptions && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < maxOptions && (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          + Add Option
        </button>
      )}
    </div>
  )
}