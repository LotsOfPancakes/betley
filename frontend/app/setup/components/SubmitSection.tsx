// frontend/app/setup/components/SubmitSection.tsx
'use client'

import { BetCreationState } from '../types/setup.types'

interface SubmitSectionProps {
  isValid: boolean
  isConnected: boolean
  state: BetCreationState
  onSubmit: () => void
  onClearError: () => void
}

export default function SubmitSection({
  isValid,
  isConnected,
  state,
  onSubmit,
  onClearError
}: SubmitSectionProps) {
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet First'
    if (state.isCreating) return 'Confirming...'
    if (state.isConfirming) return 'Creating Private Bet...'
    if (state.isSuccess) return '✅ Bet Created Successfully! Redirecting...'
    return 'Create Private Bet'
  }

  const isDisabled = !isConnected || !isValid || state.isCreating || state.isConfirming || state.isSuccess

  return (
    <div className="space-y-4">


      {/* Error Message */}
      {state.error && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-300 text-sm">{state.error}</p>
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Status Messages - Remove success message since it's now in button */}
      {state.isCreating && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <p className="text-yellow-300 text-sm">⏳ Waiting for wallet confirmation...</p>
        </div>
      )}

      {state.isConfirming && (
        <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <p className="text-blue-300 text-sm">⏳ Creating bet... Please wait.</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        {getButtonText()}
      </button>

      {/* Privacy Info */}
      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
        <p className="text-gray-300 text-xs">
          💡 <strong>Privacy Note:</strong> Your bet will have a unique random ID that makes it impossible 
          for others to discover by guessing. Only share the direct link with people you want to participate.
        </p>
      </div>
    </div>
  )
}