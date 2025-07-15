// frontend/app/setup/components/FormProgressIndicator.tsx
'use client'

interface FormProgressIndicatorProps {
  formData: {
    name: string
    options: string[]
    duration: { hours: number; minutes: number }
  }
  isValid: boolean
}

export default function FormProgressIndicator({ formData, isValid }: FormProgressIndicatorProps) {
  // Calculate completion status for each section
  const nameComplete = formData.name.trim().length >= 5
  const optionsComplete = formData.options.filter(opt => opt.trim().length > 0).length >= 2
  const durationComplete = (formData.duration.hours * 60 + formData.duration.minutes) > 0
  
  const completedSections = [nameComplete, optionsComplete, durationComplete].filter(Boolean).length
  const totalSections = 3
  const progressPercentage = (completedSections / totalSections) * 100

  const steps = [
    { name: 'Title', completed: nameComplete, icon: '📝' },
    { name: 'Options', completed: optionsComplete, icon: '🎯' },
    { name: 'Duration', completed: durationComplete, icon: '⏰' }
  ]

  return (
    <div className="mb-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Setup Progress</h3>
        <span className="text-sm text-gray-400">
          {completedSections}/{totalSections} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isValid ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <div key={step.name} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {step.completed ? '✓' : step.icon}
            </div>
            <span className={`text-xs mt-1 ${
              step.completed ? 'text-green-400' : 'text-gray-400'
            }`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {/* Completion message */}
      {isValid && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-lg">
          <p className="text-green-300 text-sm text-center">
            🎉 Your bet is ready to create! All requirements met.
          </p>
        </div>
      )}
    </div>
  )
}