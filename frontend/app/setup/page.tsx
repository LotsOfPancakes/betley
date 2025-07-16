// frontend/app/setup/page.tsx
'use client'

import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { useNotification } from '@/lib/hooks/useNotification'
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'

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
  
  //const { isValid, getFieldError } = useBetValidation(formData) // removed getFieldError because not used, see Ln89 for BetNameInput
  const { isValid } = useBetValidation(formData)

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
    <PageErrorBoundary>
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Setup New Bet</h1>
        </div>

        <div className="bg-gray-900 p-2"> {/* old className bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 */}
          {!address ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-white mb-4">Creating a Bet?</h2>
                <div className="flex gap-4 justify-center"><ConnectKitButton />
                </div>
            </div>
          ) : (
            <div className="space-y-8">
               {/* Bet Name Input - PROTECTED */}
                <ComponentErrorBoundary>
                  <BetNameInput
                    value={formData.name}
                    onChange={updateName}
                  //  isValid={!getFieldError('name') && formData.name.length >= 5} //temporarily remove since we already have a different form of protection
                  />
                </ComponentErrorBoundary>

                {/* Options Manager - PROTECTED */}
                <ComponentErrorBoundary>
                  <OptionsManager
                    options={formData.options}
                    onChange={updateOptions}
                  />
                </ComponentErrorBoundary>

                {/*Duration Selector - PROTECTED */}
                <ComponentErrorBoundary>
                  <DurationSelector
                    duration={formData.duration}
                    onChange={updateDuration}                  
                  />
                </ComponentErrorBoundary>

                {/* Submit Section - PROTECTED */}
                <ComponentErrorBoundary>
                  <SubmitSection
                    isValid={isValid}
                    isConnected={!!address}
                    state={creationState}
                    onSubmit={handleSubmit}
                    onClearError={clearError}
                  />
                </ComponentErrorBoundary>
            </div>
            
          )}
        </div>
      </div>
    </div>
    </PageErrorBoundary>

  )
}
