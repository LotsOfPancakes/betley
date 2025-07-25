// frontend/app/setup/components/PublicPrivateToggle.tsx
'use client'

interface PublicPrivateToggleProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
}

export default function PublicPrivateToggle({ isPublic, onChange }: PublicPrivateToggleProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="block text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Bet Visibility</h3>
      </div>

      <div className="space-y-3">
        {/* Private Option */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="visibility"
            checked={!isPublic}
            onChange={() => onChange(false)}
            className="mt-1 w-4 h-4 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500 focus:ring-2"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400">🔒</span>
              <span className="font-medium text-white">Private</span>
              <span className="text-sm text-green-400 font-medium">Default</span>
            </div>
            <p className="text-sm text-gray-400">
              Only people with the link can find and participate in this bet
            </p>
          </div>
        </label>

        {/* Public Option */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="visibility"
            checked={isPublic}
            onChange={() => onChange(true)}
            className="mt-1 w-4 h-4 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500 focus:ring-2"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">🌍</span>
              <span className="font-medium text-white">Public</span>
            </div>
            <p className="text-sm text-gray-400">
              Appears on the public bets page for anyone to discover and join
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}