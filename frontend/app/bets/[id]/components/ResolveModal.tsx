// frontend/app/bets/[id]/components/ResolveModal.tsx 
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 rounded-3xl max-w-md w-full mx-auto shadow-2xl shadow-green-500/20">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Resolve Bet</h2>
              <p className="text-gray-400 text-sm">&quot;{betName}&quot;</p>
            </div>
            {!isResolving && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 p-2 rounded-full hover:bg-gray-700/50"
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
          <p className="text-gray-300 mb-6 text-center">
            Which option is the winning outcome?
          </p>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                disabled={isResolving}
                className={`w-full p-4 rounded-2xl border transition-all duration-300 text-left group ${
                  selectedOption === index
                    ? 'border-green-500/60 bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-white shadow-xl shadow-green-500/20 scale-105'
                    : 'border-gray-600/50 bg-gray-800/40 text-gray-300 hover:border-green-500/30 hover:bg-gray-700/50 hover:scale-105'
                } ${isResolving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg group-hover:text-white transition-colors">
                    {option}
                  </span>
                  {selectedOption === index && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
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
          <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/40 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-300 text-sm font-semibold">Resolution is permanent!</p>
                <p className="text-yellow-200 text-sm mt-1 leading-relaxed">
                  Winners will be able to claim their share of the total pool.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700/50 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isResolving}
            className="flex-1 px-6 py-3 border border-gray-600/50 bg-gray-800/40 text-gray-300 rounded-2xl hover:bg-gray-700/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={selectedOption === null || isResolving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-green-500/30 disabled:shadow-none font-semibold flex items-center justify-center gap-2"
          >
            {isResolving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Resolving...
              </>
            ) : (
              'Confirm Resolution'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}