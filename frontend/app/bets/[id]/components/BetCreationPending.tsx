// frontend/app/bets/[id]/components/BetCreationPending.tsx
'use client'

interface BetCreationPendingProps {
  randomId: string
}

export function BetCreationPending({ randomId }: BetCreationPendingProps) {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">🎯 Creating Your Bet</h1>
            <p className="text-gray-300">Your bet is being created on the blockchain...</p>
          </div>

          {/* Loading Animation */}
          <div className="text-center mb-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-400 font-medium">Please wait while your transaction is processed</p>
          </div>

          {/* Bet ID Info */}
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-6">
            <h3 className="text-blue-300 font-semibold mb-2">🔒 Your Private Bet ID</h3>
            <p className="text-blue-200 text-sm mb-3">
              Your bet will be accessible at this private URL:
            </p>
            <div className="bg-gray-700 rounded p-3">
              <code className="text-white text-sm break-all">
                {typeof window !== 'undefined' ? window.location.href : `.../${randomId}`}
              </code>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 text-center">
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                ⏳ <strong>Please keep this tab open</strong> while your transaction confirms
              </p>
            </div>
            
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <p className="text-gray-300 text-sm">
                💡 Once confirmed, this page will automatically load your bet details
              </p>
            </div>
          </div>

          {/* Manual Refresh Option */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}