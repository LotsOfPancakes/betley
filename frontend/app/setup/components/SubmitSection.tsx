'use client'

import { ConnectKitButton } from 'connectkit'
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
    if (state.isCreating) return 'Confirming...'
    if (state.isConfirming) return 'Creating Private Bet...'
    if (state.isSuccess) return '✅ Bet Created Successfully! Redirecting...'
    if (!isConnected) return 'Connect Wallet & Create Bet'
    return 'Create Private Bet'
  }

  const getButtonDisabled = () => {
    // Form must be valid to proceed
    if (!isValid) return true
    // Disable during creation process
    if (state.isCreating || state.isConfirming || state.isSuccess) return true
    return false
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {state.error && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-xl">
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

      {/* Submit Button - ConnectKit Integration */}
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button
            onClick={isConnected ? onSubmit : show}
            disabled={getButtonDisabled()}
            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 ${
              getButtonDisabled()
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white hover:scale-105 shadow-lg shadow-green-500/20'
            }`}
          >
            {getButtonText()}
          </button>
        )}
      </ConnectKitButton.Custom>

      {/* Misc. Bet info text */}
      <div className="text-sm text-gray-400">
        <p>• 🧙🏼 As creator, you earn <span className="text-green-300">1%</span> of the losing option upon resolution</p>
        <p>• 🔐 Privacy: Your bet will have a unique random ID. Only share the direct link with people you want to participate.</p>
      </div>
    </div>
  )
}