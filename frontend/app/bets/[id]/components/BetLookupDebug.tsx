// Temporary debug component to understand what's happening
// Add this to any page temporarily

'use client'
import { useParams } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { UnifiedBetMapper } from '@/lib/betIdMapping'
import { useEffect } from 'react'

export function BetLookupDebug() {
  const { id: randomBetId } = useParams()
  
  // Enhanced debugging
  useEffect(() => {
    console.log('🔍 BET LOOKUP DEBUG - Page loaded:', {
      randomBetId,
      timestamp: new Date().toISOString()
    })
    
    // Test the mapping system
    const allMappings = UnifiedBetMapper.getAllMappings()
    const numericId = UnifiedBetMapper.getNumericId(randomBetId as string)
    const rawStorage = localStorage.getItem('betley_unified_mappings')
    
    console.log('🔍 MAPPING SYSTEM ANALYSIS:', {
      searchingFor: randomBetId,
      foundNumericId: numericId,
      totalMappings: allMappings.length,
      allMappings,
      rawStorageLength: rawStorage?.length || 0,
      rawStorage
    })
    
    // Test if ID exists in any form
    const idExistsAsRandom = allMappings.some(m => m.randomId === randomBetId)
    const idExistsAsNumeric = allMappings.some(m => m.numericId.toString() === randomBetId)
    
    console.log('🔍 ID EXISTENCE CHECK:', {
      randomBetId,
      existsAsRandomId: idExistsAsRandom,
      existsAsNumericId: idExistsAsNumeric,
      couldBeWrongFormat: !idExistsAsRandom && !idExistsAsNumeric
    })
    
  }, [randomBetId])

  const { data: betCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  const allMappings = UnifiedBetMapper.getAllMappings()
  const numericId = UnifiedBetMapper.getNumericId(randomBetId as string)

  return (
    <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
      <h3 className="text-red-200 font-semibold mb-2">🔍 Enhanced Debug Information</h3>
      <div className="text-red-100 text-sm space-y-2">
        <div><strong>Random Bet ID:</strong> {randomBetId as string}</div>
        <div><strong>Contract Address:</strong> {BETLEY_ADDRESS}</div>
        <div><strong>Bet Counter:</strong> {betCounter?.toString() || 'Loading...'}</div>
        <div><strong>Numeric ID from mapping:</strong> 
          <span className={numericId !== null ? 'text-green-300' : 'text-red-300'}>
            {numericId?.toString() || 'NOT FOUND'}
          </span>
        </div>
        <div><strong>Total mappings:</strong> {allMappings.length}</div>
        
        {/* Show what we expected vs what we got */}
        <div className="mt-3 p-2 bg-red-800 rounded">
          <strong>Expected Behavior:</strong>
          <div className="text-xs">
            • Random ID &quot;{randomBetId as string}&quot; should map to a numeric ID<br/>
            • That numeric ID should exist in contract (0 to {betCounter ? (Number(betCounter) - 1) : '?'})<br/>
            • Mapping status: {numericId !== null ? '✅ Found' : '❌ Missing'}
          </div>
        </div>
        
        <details>
          <summary className="cursor-pointer text-yellow-300">🔍 All Mappings ({allMappings.length})</summary>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {allMappings.length === 0 ? (
              <div className="text-red-300">No mappings found!</div>
            ) : (
              allMappings.map((mapping, index) => (
                <div key={index} className="text-xs p-2 bg-red-800 rounded mb-1">
                  <div><strong>Random:</strong> {mapping.randomId}</div>
                  <div><strong>Numeric:</strong> {mapping.numericId}</div>
                  <div><strong>Name:</strong> {mapping.name}</div>
                  <div className="text-gray-400">Created: {new Date(mapping.createdAt).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </details>
        
        <details>
          <summary className="cursor-pointer text-blue-300">📦 Raw Storage</summary>
          <pre className="text-xs mt-2 bg-red-800 p-2 rounded overflow-auto max-h-32">
            {localStorage.getItem('betley_unified_mappings') || 'EMPTY'}
          </pre>
        </details>
      </div>
    </div>
  )
}