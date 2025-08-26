// frontend/app/setup/hooks/useBetValidation.ts
import { useMemo } from 'react'
import { BetFormData, ValidationError } from '../types/setup.types'

export function useBetValidation(formData: BetFormData) {
  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = []

    // Validate bet name
    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Bet title is required' })
    } else if (formData.name.length < 5) {
      errors.push({ field: 'name', message: 'Bet title must be at least 5 characters' })
    } else if (formData.name.length > 100) {
      errors.push({ field: 'name', message: 'Bet title must be less than 100 characters' })
    }

    // Validate options
    const filledOptions = formData.options.filter(opt => opt.trim().length > 0)
    if (filledOptions.length < 2) {
      errors.push({ field: 'options', message: 'At least 2 options are required' })
    } else if (filledOptions.length > 4) {
      errors.push({ field: 'options', message: 'Maximum 4 options allowed' })
    }

    // Check for duplicate options
    const uniqueOptions = new Set(filledOptions.map(opt => opt.trim().toLowerCase()))
    if (uniqueOptions.size !== filledOptions.length) {
      errors.push({ field: 'options', message: 'Options must be unique' })
    }

    // Validate option length
    const tooLongOptions = filledOptions.filter(opt => opt.length > 50)
    if (tooLongOptions.length > 0) {
      errors.push({ field: 'options', message: 'Each option must be less than 50 characters' })
    }

    // Validate duration
    const totalMinutes = formData.duration.hours * 60 + formData.duration.minutes
    if (totalMinutes <= 0) {
      errors.push({ field: 'duration', message: 'Duration must be at least 1 minute' })
    } else if (totalMinutes > 99999 * 60) {
      errors.push({ field: 'duration', message: 'Duration cannot exceed 99999 hours' })
    }

    return errors
  }, [formData])

  const isValid = validationErrors.length === 0
  
  const getFieldError = (field: keyof BetFormData) => {
    return validationErrors.find(error => error.field === field)?.message
  }

  const hasFieldError = (field: keyof BetFormData) => {
    return validationErrors.some(error => error.field === field)
  }

  return {
    isValid,
    errors: validationErrors,
    getFieldError,
    hasFieldError
  }
}