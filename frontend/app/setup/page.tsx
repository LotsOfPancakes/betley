// frontend/app/setup/page.tsx - Updated with public/private toggle
'use client'

import { useEffect, Suspense, useMemo } from 'react'
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

// Helper functions for URL parameter parsing
function safeDecodeParam(param: string): string {
  if (!param) return ''
  try {
    return decodeURIComponent(param)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/[\"'&]/g, '') // Remove potential XSS chars (keep <>$ for price comparisons)
      .trim()
  } catch {
    return '' // Return empty string if decoding fails
  }
}

function parseOptionsFromUrl(optionsParam: string): string[] {
  if (!optionsParam) return []
  
  const decoded = safeDecodeParam(optionsParam)
  if (!decoded) return []
  
  return decoded
    .split(',')
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0 && opt.length <= 100) // Validate option length
    .slice(0, 4) // Max 4 options
}

function parseDurationFromUrl(durationParam: string): { hours: number; minutes: number } | null {
  if (!durationParam) return null
  
  const decoded = safeDecodeParam(durationParam)
  const match = decoded.match(/^(\d+)(m|h|d|w)$/i)
  
  if (!match) return null
  
  const [, value, unit] = match
  const numValue = parseInt(value, 10)
  
  if (numValue <= 0) return null
  
  switch (unit.toLowerCase()) {
    case 'm':
      if (numValue < 30) return null // Minimum 30 minutes
      return { hours: 0, minutes: numValue }
    case 'h':
      return { hours: numValue, minutes: 0 }
    case 'd':
      return { hours: numValue * 24, minutes: 0 }
    case 'w':
      return { hours: numValue * 24 * 7, minutes: 0 }
    default:
      return null
  }
}

function parseVisibilityFromUrl(visibilityParam: string): boolean | null {
  if (!visibilityParam) return null
  
  const decoded = safeDecodeParam(visibilityParam).toLowerCase()
  if (decoded === 'public') return true
  if (decoded === 'private') return false
  return null
}

function SetupPageContent() {
  const { address } = useAccount()
  const { showWarning } = useNotification()
  const searchParams = useSearchParams()

  // Get all parameters from URL
  const titleFromUrl = searchParams?.get('title') || ''
  const optionsFromUrl = searchParams?.get('options') || ''
  const durationFromUrl = searchParams?.get('duration') || ''
  const visibilityFromUrl = searchParams?.get('visibility') || ''
  
  // Get Telegram-specific parameters
  const sourceFromUrl = searchParams?.get('source') || ''
  const tgUserFromUrl = searchParams?.get('tg_user') || ''
  const tgGroupFromUrl = searchParams?.get('tg_group') || ''

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

  // Pre-fill all fields from URL parameters
  useEffect(() => {
    let hasUpdates = false

    // Pre-fill bet name
    if (titleFromUrl && !formData.name) {
      updateName(safeDecodeParam(titleFromUrl))
      hasUpdates = true
    }

    // Pre-fill options (only if current options are default ['Yes', 'No'])
    const parsedOptions = parseOptionsFromUrl(optionsFromUrl)
    const isDefaultOptions = formData.options.length === 2 && 
                            formData.options[0] === 'Yes' && 
                            formData.options[1] === 'No'
    
    if (parsedOptions.length >= 2 && isDefaultOptions) {
      updateOptions(parsedOptions)
      hasUpdates = true
    }

    // Pre-fill duration (only if current duration is default 1h)
    const parsedDuration = parseDurationFromUrl(durationFromUrl)
    const isDefaultDuration = formData.duration.hours === 1 && formData.duration.minutes === 0
    
    if (parsedDuration && isDefaultDuration) {
      updateDuration(parsedDuration)
      hasUpdates = true
    }

    // Pre-fill visibility (only if current is default private/false)
    const parsedVisibility = parseVisibilityFromUrl(visibilityFromUrl)
    if (parsedVisibility !== null && !formData.isPublic) {
      updateIsPublic(parsedVisibility)
      hasUpdates = true
    }

    // Log for debugging (remove in production)
    if (hasUpdates) {
      console.log('Pre-filled form from URL parameters:', {
        title: titleFromUrl ? safeDecodeParam(titleFromUrl) : 'unchanged',
        options: parsedOptions.length > 0 ? parsedOptions : 'unchanged',
        duration: parsedDuration || 'unchanged',
        visibility: parsedVisibility !== null ? parsedVisibility : 'unchanged'
      })
    }
  }, [titleFromUrl, optionsFromUrl, durationFromUrl, visibilityFromUrl, formData.name, formData.options, formData.duration, formData.isPublic, updateName, updateOptions, updateDuration, updateIsPublic])

  // Create Telegram metadata object
  const telegramMetadata = useMemo(() => {
    if (sourceFromUrl === 'telegram') {
      return {
        source: 'telegram' as const,
        sourceMetadata: {
          telegram_group_id: tgGroupFromUrl || undefined,
          telegram_user_id: tgUserFromUrl || undefined
        }
      }
    }
    return { source: 'web' as const, sourceMetadata: null }
  }, [sourceFromUrl, tgGroupFromUrl, tgUserFromUrl])

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
      formData.isPublic,       // isPublic flag
      telegramMetadata.source, // source (web/telegram)
      telegramMetadata.sourceMetadata // Telegram metadata
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
              <div className={`${COLORS.gradients.card} ${DIMENSIONS.borderRadius.card} p-6 ${COLORS.borders.cardHover} ${ANIMATIONS.transitionSlow}`}>
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