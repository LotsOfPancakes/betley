// frontend/app/setup/page.tsx - Updated with public/private toggle
'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useNotification } from '@/lib/hooks/useNotification'
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { ZERO_ADDRESS } from '@/lib/tokenUtils'
import BackgroundElements from '@/app/components/BackgroundElements'
import { COLORS, DIMENSIONS, ANIMATIONS } from '@/lib/constants/ui'

// Import our extracted components and hooks
import BetNameInput from './components/BetNameInput'

import OptionsManager from './components/OptionsManager'
import DurationSelector from './components/DurationSelector'
import BetVisibilitySelector from './components/BetVisibilitySelector'
import SubmitSection from './components/SubmitSection'

import { useBetForm } from './hooks/useBetForm'
import { useBetValidation } from './hooks/useBetValidation'
import { useBetCreationNew } from './hooks/useBetCreationNew'

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
    updateIsPublic, 
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
  } = useBetCreationNew()

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
    
    // Pass all details for database storage
    createBet(
      formData.name,           // betName
      filledOptions,           // options array
      durationInSeconds,       // duration
      ZERO_ADDRESS, // native ETH
      formData.isPublic        // isPublic flag
    )
  }

  const creationState = {
    isCreating,
    isConfirming,
    isSuccess,
    error
  }

  return (
    <div className={`min-h-screen ${COLORS.backgrounds.primary} ${COLORS.text.primary} relative overflow-hidden`}>
      <BackgroundElements />
      
      <div className="relative z-10 py-12">
        <div className={`${DIMENSIONS.maxWidth.form} mx-auto px-4`}>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl md:text-4xl font-bold ${COLORS.text.primary}`}>Set up New Bet</h1>
          </div>  

          {/* Always show the form - no wallet check */}
          <div className="space-y-5">
            {/* Bet Name Input */}
            <ComponentErrorBoundary>
              <div className={`${COLORS.gradients.card} backdrop-blur-sm ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
                <BetNameInput
                  value={formData.name}
                  onChange={updateName}
                />
              </div>
            </ComponentErrorBoundary>



            {/* Options Manager */}
            <ComponentErrorBoundary>
              <div className={`${COLORS.gradients.card} backdrop-blur-sm ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
                <OptionsManager
                  options={formData.options}
                  onChange={updateOptions}
                />
              </div>
            </ComponentErrorBoundary>

            {/* Duration Selector */}
            <ComponentErrorBoundary>
              <div className={`${COLORS.gradients.card} backdrop-blur-sm ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
                <DurationSelector
                  duration={formData.duration}
                  onChange={updateDuration}                  
                />
              </div>
            </ComponentErrorBoundary>

            {/* Public/Private Toggle */}
            <ComponentErrorBoundary>
              <div className={`${COLORS.gradients.card} backdrop-blur-sm ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
                <BetVisibilitySelector
                  isPublic={formData.isPublic}
                  onChange={updateIsPublic}
                />
              </div>
            </ComponentErrorBoundary>

            {/* Submit Section */}
            <ComponentErrorBoundary>
              <div className={`${COLORS.gradients.card} backdrop-blur-sm ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
                <SubmitSection
                  isValid={isValid}
                  isConnected={!!address}
                  state={creationState}
                  onSubmit={handleSubmit}
                  onClearError={clearError}
                  isPublic={formData.isPublic}
                />
              </div>
            </ComponentErrorBoundary>
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
        <div className={`min-h-screen ${COLORS.backgrounds.primary} flex items-center justify-center`}>
          <div className={COLORS.text.primary}>Betley is loading...</div>
        </div>
      }>
        <SetupPageContent />
      </Suspense>
    </PageErrorBoundary>
  )
}