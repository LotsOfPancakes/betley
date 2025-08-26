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
        <h3 className="block text-lg font-semibold text-gray-200">
          Bet Visibility
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Private Option */}
        <button
          onClick={() => onChange(false)}
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
            !isPublic
              ? 'border-gray-500 bg-gray-500/8 text-gray-300' 
              : 'border-gray-600/45 hover:border-gray-500/65 text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-bold">Private</span>
                <span className="text-xs text-green-400/80 font-medium bg-gray-700/80 px-2 py-0.5 rounded-md">
                  Default
                </span>
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                Only people with link can participate
              </p>
            </div>
            {!isPublic && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
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
          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-102 ${
            isPublic
              ? 'border-gray-500 bg-gray-500/8 text-gray-300' 
              : 'border-gray-600/45 hover:border-gray-500/65 text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-bold">Public</span>
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                Bet will be discoverable
              </p>
            </div>
            {isPublic && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
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