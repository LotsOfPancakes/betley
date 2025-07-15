// frontend/app/setup/page.tsx
'use client'

import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { useNotification } from '@/lib/hooks/useNotification'

// Import our extracted components and hooks
import BetNameInput from './components/BetNameInput'
import OptionsManager from './components/OptionsManager'
import DurationSelector from './components/DurationSelector'
import SubmitSection from './components/SubmitSection'

import { useBetForm } from './hooks/useBetForm'
import { useBetValidation } from './hooks/useBetValidation'
import { useBetCreation } from './hooks/useBetCreation'

export default function SetupPage() {
  const { address } = useAccount()
  const { showWarning } = useNotification()
  
  // Use our custom hooks
  const {
    formData,
    updateName,
    updateOptions,
    updateDuration,
    getFilledOptions,
    getDurationInSeconds
  } = useBetForm()
  
  const { isValid, getFieldError } = useBetValidation(formData)
  
  const {
    isCreating,
    isConfirming,
    isSuccess,
    error,
    createBet,
    clearError,
  } = useBetCreation()

  const handleSubmit = () => {
    if (!isValid) {
      showWarning('Please fix the form errors before submitting', 'Form Validation')
      return
    }

    const filledOptions = getFilledOptions()
    const durationInSeconds = getDurationInSeconds()
    
    createBet(formData.name, filledOptions, durationInSeconds)
  }

  const creationState = {
    isCreating,
    isConfirming,
    isSuccess,
    error
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Create New Bet</h1>
          <ConnectKitButton />
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          {!address ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">
                Please connect your wallet to create a new bet
              </p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="space-y-8">

              {/* Bet Name Input */}
              <div>
                <BetNameInput 
                  value={formData.name} 
                  onChange={updateName}
                  isValid={!getFieldError('name') && formData.name.length >= 5}
                />
              </div>

              {/* Options Manager */}
              <div>
                <OptionsManager 
                  options={formData.options} 
                  onChange={updateOptions}
                />
              </div>

              {/* Duration Selector */}
              <div>
                <DurationSelector 
                  duration={formData.duration} 
                  onChange={updateDuration}
                />
              </div>

              {/* Submit Section */}
              <SubmitSection
                isValid={isValid}
                isConnected={!!address}
                state={creationState}
                onSubmit={handleSubmit}
                onClearError={clearError}
              />
              
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
