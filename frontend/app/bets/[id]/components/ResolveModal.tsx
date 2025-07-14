// app/bets/[id]/components/ResolveModal.tsx
'use client'

import { useState } from 'react'

interface ResolveModalProps {
  isOpen: boolean
  onClose: () => void
  onResolve: (winningOptionIndex: number) => Promise<void>
  options: readonly string[]
  betName: string
}

export function ResolveModal({
  isOpen,
  onClose,
  onResolve,
  options,
  betName
}: ResolveModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  if (!isOpen) return null

  const handleResolve = async () => {
    if (selectedOption === null) return

    try {
      setIsResolving(true)
      await onResolve(selectedOption)
      onClose() // Close modal on success
    } catch {
      // Error handling is done in the parent component
      setIsResolving(false)
    }
  }

  const handleClose = () => {
    if (isResolving) return // Prevent closing while resolving
    setSelectedOption(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl max-w-md w-full mx-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Resolve Bet</h2>
              <p className="text-gray-400 text-sm">&quot;{betName}&quot;</p>
            </div>
            {!isResolving && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            Which option is the winning outcome?
          </p>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                disabled={isResolving}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedOption === index
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-650'
                } ${isResolving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {selectedOption === index && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-300 text-sm font-medium">Resolution is permanent!</p>
                <p className="text-yellow-200 text-sm mt-1">
                  Winners will be able to claim their share of the total pool.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isResolving}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={selectedOption === null || isResolving}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isResolving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resolving...
              </>
            ) : (
              'Resolve Bet'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}