// frontend/app/setup/page.tsx - Updated with modern background (corrected props)
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
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.2]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 left-32 w-96 h-96 bg-gradient-to-tr from-green-500/15 to-lime-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Setup New Bet</h1>
          </div>

          <div className="space-y-8">
            {!address ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500">
                  <div className="text-5xl mb-4">📝</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Creating a Bet?</h2>
                  <div className="flex justify-center">
                    <ConnectKitButton />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Bet Name Input - PROTECTED */}
                <ComponentErrorBoundary>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500">
                    <BetNameInput
                      value={formData.name}
                      onChange={updateName}
                    />
                  </div>
                </ComponentErrorBoundary>

                {/* Options Manager - PROTECTED */}
                <ComponentErrorBoundary>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500">
                    <OptionsManager
                      options={formData.options}
                      onChange={updateOptions}
                    />
                  </div>
                </ComponentErrorBoundary>

                {/* Duration Selector - PROTECTED */}
                <ComponentErrorBoundary>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500">
                    <DurationSelector
                      duration={formData.duration}
                      onChange={updateDuration}                  
                    />
                  </div>
                </ComponentErrorBoundary>

                {/* Submit Section - PROTECTED */}
                <ComponentErrorBoundary>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 hover:border-green-400/40 transition-all duration-500">
                    <SubmitSection
                      isValid={isValid}
                      isConnected={!!address}
                      state={creationState}
                      onSubmit={handleSubmit}
                      onClearError={clearError}
                    />
                  </div>
                </ComponentErrorBoundary>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <PageErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-[0.2]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          {/* Floating gradient orbs */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 left-32 w-96 h-96 bg-gradient-to-tr from-green-500/15 to-lime-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="text-center relative z-10">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8">
              <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">Loading...</p>
            </div>
          </div>
        </div>
      }>
        <SetupPageContent />
      </Suspense>
    </PageErrorBoundary>
  )
}