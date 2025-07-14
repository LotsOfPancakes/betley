// Temporary debug component to understand what's happening
// Add this to any page temporarily

'use client'
import { useParams } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'

export function BetLookupDebug() {
  const { id: randomBetId } = useParams()
  
  // Check bet counter on new contract
  const { data: betCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  // Check localStorage mappings
  const getAllLocalStorageKeys = () => {
    if (typeof window === 'undefined') return []
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    return keys
  }

  const debugInfo = {
    randomBetId: randomBetId as string,
    betCounter: betCounter?.toString(),
    contractAddress: BETLEY_ADDRESS,
    localStorageKeys: getAllLocalStorageKeys(),
    // Check different mapping patterns
    oldMapping: typeof window !== 'undefined' ? localStorage.getItem(`bet_${randomBetId}`) : null,
    newMapping: typeof window !== 'undefined' ? localStorage.getItem('betley_bet_mappings') : null,
    oldUtilsMapping: typeof window !== 'undefined' ? localStorage.getItem('betley_bet_id_mapping') : null,
  }

  console.log('🔍 BET LOOKUP DEBUG:', debugInfo)

  return (
    <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
      <h3 className="text-red-200 font-semibold mb-2">🔍 Debug Information</h3>
      <div className="text-red-100 text-sm space-y-1">
        <div><strong>Random Bet ID:</strong> {randomBetId as string}</div>
        <div><strong>Contract Address:</strong> {BETLEY_ADDRESS}</div>
        <div><strong>Bet Counter (new contract):</strong> {betCounter?.toString() || 'Loading...'}</div>
        <div><strong>LocalStorage Keys:</strong></div>
        <ul className="ml-4 text-xs">
          {getAllLocalStorageKeys().map(key => (
            <li key={key}>• {key}</li>
          ))}
        </ul>
        
        {debugInfo.oldMapping && (
          <div>
            <strong>Old Mapping Found:</strong>
            <pre className="text-xs mt-1 bg-red-800 p-2 rounded overflow-auto">
              {debugInfo.oldMapping}
            </pre>
          </div>
        )}
        
        {debugInfo.newMapping && (
          <div>
            <strong>New Mapping Found:</strong>
            <pre className="text-xs mt-1 bg-red-800 p-2 rounded overflow-auto">
              {debugInfo.newMapping}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}