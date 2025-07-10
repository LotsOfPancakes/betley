// frontend/app/setup/page.tsx
'use client'

import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

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
      console.log('Form is not valid')
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
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">Connect your wallet to create a bet</p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bet Name Input */}
              <div>
                <BetNameInput 
                  value={formData.name} 
                  onChange={updateName} 
                />
                {getFieldError('name') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('name')}</p>
                )}
              </div>

              {/* Options Manager */}
              <div>
                <OptionsManager 
                  options={formData.options} 
                  onChange={updateOptions} 
                />
                {getFieldError('options') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('options')}</p>
                )}
              </div>

              {/* Duration Selector */}
              <div>
                <DurationSelector 
                  duration={formData.duration} 
                  onChange={updateDuration} 
                />
                {getFieldError('duration') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('duration')}</p>
                )}
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