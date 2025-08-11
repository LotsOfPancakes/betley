// frontend/app/setup/components/BetDescriptionInput.tsx
'use client'

interface BetDescriptionInputProps {
  value: string
  onChange: (description: string) => void
}

export default function BetDescriptionInput({ value, onChange }: BetDescriptionInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-white">
          Description
        </label>
        <span className="text-sm text-gray-400">
          Optional
        </span>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add more details about your bet (optional)..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
          rows={3}
          maxLength={1000}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-3 text-xs text-gray-500">
          {value.length}/1000
        </div>
      </div>
      
      <p className="text-sm text-gray-400">
        Provide additional context, rules, or criteria for your bet.
      </p>
    </div>
  )
}