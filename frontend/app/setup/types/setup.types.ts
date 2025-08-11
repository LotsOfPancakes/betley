// frontend/app/setup/types/setup.types.ts

export interface Duration {
  hours: number
  minutes: number
}

export interface BetFormData {
  name: string
  options: string[]
  duration: Duration
  isPublic: boolean
}

export interface ValidationError {
  field: keyof BetFormData
  message: string
}

export interface BetCreationState {
  isCreating: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: string | null
}