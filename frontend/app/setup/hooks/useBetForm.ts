// app/setup/hooks/useBetForm.ts
import { useState } from 'react'
import { BetFormData } from '../types/setup.types'

const initialFormData: BetFormData = {
  name: '',
  options: ['Yes', 'No'],
  duration: { hours: 1, minutes: 0 }
}

export function useBetForm(initialTitle?: string) {
  const [formData, setFormData] = useState<BetFormData>({
    ...initialFormData,
    name: initialTitle || initialFormData.name
  })

  const updateName = (name: string) => {
    setFormData(prev => ({ ...prev, name }))
  }

  const updateOptions = (options: string[]) => {
    setFormData(prev => ({ ...prev, options }))
  }

  const updateDuration = (duration: { hours: number; minutes: number }) => {
    setFormData(prev => ({ ...prev, duration }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
  }

  // Helper to get filled options (non-empty)
  const getFilledOptions = () => {
    return formData.options.filter(option => option.trim().length > 0)
  }

  // Calculate duration in seconds for contract
  const getDurationInSeconds = () => {
    const totalMinutes = formData.duration.hours * 60 + formData.duration.minutes
    return totalMinutes * 60 // Convert to seconds
  }

  return {
    formData,
    updateName,
    updateOptions,
    updateDuration,
    resetForm,
    getFilledOptions,
    getDurationInSeconds
  }
}