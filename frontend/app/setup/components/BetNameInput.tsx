// frontend/app/setup/components/BetNameInput.tsx
'use client'

interface BetNameInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export default function BetNameInput({ 
  value, 
  onChange, 
  maxLength = 100 
}: BetNameInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Bet Title
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Will it rain tomorrow?"
        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        maxLength={maxLength}
      />
      <p className="text-xs text-gray-400 mt-1">
        {value.length}/{maxLength} characters
      </p>
    </div>
  )
}