import { useState } from 'react'

interface ResolutionModalProps {
  options: readonly string[]
  onClose: () => void
  onResolve: (option: number) => void
  isPending: boolean
}

export function ResolutionModal({
  options,
  onClose,
  onResolve,
  isPending
}: ResolutionModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleSubmit = () => {
    if (selectedOption !== null) {
      onResolve(selectedOption)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Resolve Bet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">Select the winning option:</p>
        
        <div className="space-y-2 mb-6">
          {options.map((option, index) => (
            <label key={index} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                value={index}
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
                className="text-blue-600"
              />
              <span className="text-white">{option}</span>
            </label>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || isPending}
            className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 transition-colors"
          >
            {isPending ? 'Resolving...' : 'Confirm Resolution'}
          </button>
        </div>
      </div>
    </div>
  )
}