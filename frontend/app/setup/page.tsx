'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

function SetupPageContent() {
  const { address } = useAccount()
  const { showWarning } = useNotification()
  const searchParams = useSearchParams()

  // Get title from URL parameters
  const titleFromUrl = searchParams?.get('title') || ''

  // Use our custom hooks
  const {
    formData,
    updateName,
    updateOptions,
    updateDuration,
    getFilledOptions,
    getDurationInSeconds
  } = useBetForm()
  
  const { isValid } = useBetValidation(formData)

  const {
    isCreating,
    isConfirming,
    isSuccess,
    error,
    createBet,
    clearError,
  } = useBetCreation()

  // Pre-fill bet name if coming from landing page
  useEffect(() => {
    if (titleFromUrl && !formData.name) {
      updateName(titleFromUrl)
    }
  }, [titleFromUrl, formData.name, updateName])

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
          <h1 className="text-3xl font-bold text-white">Setup New Bet</h1>
        </div>

        <div className="bg-gray-900 p-2">
          {!address ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-white mb-4">Creating a Bet?</h2>
              <div className="flex gap-4 justify-center">
                <ConnectKitButton />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Bet Name Input - PROTECTED */}
              <ComponentErrorBoundary>
                <BetNameInput
                  value={formData.name}
                  onChange={updateName}
                />
              </ComponentErrorBoundary>

              {/* Options Manager - PROTECTED */}
              <ComponentErrorBoundary>
                <OptionsManager
                  options={formData.options}
                  onChange={updateOptions}
                />
              </ComponentErrorBoundary>

              {/* Duration Selector - PROTECTED */}
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
  )
}

export default function SetupPage() {
  return (
    <PageErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }>
        <SetupPageContent />
      </Suspense>
    </PageErrorBoundary>
  )
}