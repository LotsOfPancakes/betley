// frontend/app/setup/components/BetVisibilitySelector.tsx
'use client'

interface BetVisibilitySelectorProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
}

export default function BetVisibilitySelector({ isPublic, onChange }: BetVisibilitySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="block text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Bet Visibility
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Private Option */}
        <button
          onClick={() => onChange(false)}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
            !isPublic
              ? 'border-green-500 bg-green-500/10 text-green-400' 
              : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400">🔒</span>
                <span className="font-bold">Private</span>
                <span className="text-xs text-green-400 font-medium">Default</span>
              </div>
              <p className="text-xs opacity-75">
                Only people with the link can find and participate
              </p>
            </div>
            {!isPublic && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* Public Option */}
        <button
          onClick={() => onChange(true)}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
            isPublic
              ? 'border-green-500 bg-green-500/10 text-green-400' 
              : 'border-green-500/30 hover:border-green-400/50 text-gray-300 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-400">🌍</span>
                <span className="font-bold">Public</span>
              </div>
              <p className="text-xs opacity-75">
                Discoverable as a public Bet
              </p>
            </div>
            {isPublic && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}