// frontend/components/BetMappingRecovery.tsx - Debugging and auto-recovery component
'use client'

import { useState } from 'react'
import { useReadContract, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { UnifiedBetMapper } from '@/lib/betIdMapping'

export function BetMappingRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryLog, setRecoveryLog] = useState<string[]>([])
  const config = useConfig()

  // Get current bet counter
  const { data: betCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  const addLog = (message: string) => {
    setRecoveryLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const getCurrentMappings = () => {
    return UnifiedBetMapper.getAllMappings()
  }

  const clearAllMappings = () => {
    UnifiedBetMapper.clearAllMappings()
    addLog('🗑️ Cleared all existing mappings')
  }

  const autoDiscoverBets = async () => {
    if (!betCounter) {
      addLog('❌ Bet counter not available')
      return
    }

    setIsRecovering(true)
    addLog('🔍 Starting auto-discovery of bets...')

    try {
      let discovered = 0
      
      for (let i = 0; i < Number(betCounter); i++) {
        try {
          addLog(`📖 Reading bet ${i}...`)
          
          const betDetails = await readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetDetails',
            args: [BigInt(i)],
          })

          if (betDetails) {
            const [name, , creator] = betDetails
            
            // Check if mapping already exists
            const existingRandomId = UnifiedBetMapper.getRandomId(i)
            
            if (!existingRandomId) {
              // Create new mapping
              const randomId = UnifiedBetMapper.createMapping(i, name, creator as string)
              addLog(`✅ Created mapping: ${randomId} → Bet ${i} ("${name}")`)
              discovered++
            } else {
              addLog(`ℹ️ Mapping already exists: ${existingRandomId} → Bet ${i}`)
            }
          }
        } catch (error) {
          addLog(`❌ Failed to read bet ${i}: ${error}`)
        }
      }

      addLog(`🎉 Auto-discovery complete! Discovered ${discovered} new mappings.`)
      
    } catch (error) {
      addLog(`❌ Auto-discovery failed: ${error}`)
    } finally {
      setIsRecovering(false)
    }
  }

  const manuallyFixBet = (randomId: string, numericId: number, name: string, creator: string) => {
    try {
      // Clear existing mapping for this random ID if it exists
      const mappings = UnifiedBetMapper.getAllMappings()
      const filteredMappings = mappings.filter(m => m.randomId !== randomId)
      
      // Create new correct mapping
      const newMapping = {
        randomId,
        numericId,
        name,
        creator,
        createdAt: Date.now()
      }
      
      // Save updated mappings
      if (typeof window !== 'undefined') {
        localStorage.setItem('betley_unified_mappings', JSON.stringify([...filteredMappings, newMapping]))
      }
      
      addLog(`✅ Manually fixed mapping: ${randomId} → Bet ${numericId}`)
    } catch (error) {
      addLog(`❌ Manual fix failed: ${error}`)
    }
  }

  // Quick fix for the specific ppGG3FuT issue
  const quickFixPpGG3FuT = async () => {
    setIsRecovering(true)
    addLog('🚑 Quick fix for ppGG3FuT...')
    
    try {
      // Get bet 0 details
      const betDetails = await readContract(config, {
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'getBetDetails',
        args: [BigInt(0)],
      })

      if (betDetails) {
        const [name, , creator] = betDetails
        manuallyFixBet('ppGG3FuT', 0, name, creator as string)
        addLog('🎉 Quick fix complete! Try visiting /bets/ppGG3FuT now.')
      }
    } catch (error) {
      addLog(`❌ Quick fix failed: ${error}`)
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6 mb-6">
      <h3 className="text-yellow-200 font-semibold mb-4">🔧 Bet Mapping Recovery Tools</h3>
      
      {/* Current Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h4 className="text-white font-medium mb-2">Current Status:</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Contract Bet Counter: {betCounter?.toString() || 'Loading...'}</div>
          <div>Stored Mappings: {getCurrentMappings().length}</div>
          <div>Storage Key: betley_unified_mappings</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={quickFixPpGG3FuT}
          disabled={isRecovering}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          🚑 Quick Fix ppGG3FuT
        </button>
        
        <button
          onClick={autoDiscoverBets}
          disabled={isRecovering}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          🔍 Auto-Discover All Bets
        </button>
        
        <button
          onClick={clearAllMappings}
          disabled={isRecovering}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          🗑️ Clear All Mappings
        </button>
      </div>

      {/* Recovery Log */}
      {recoveryLog.length > 0 && (
        <div className="bg-black/50 border border-gray-600 rounded p-3">
          <h4 className="text-white font-medium mb-2">Recovery Log:</h4>
          <div className="text-xs text-gray-300 max-h-40 overflow-y-auto font-mono">
            {recoveryLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          <button
            onClick={() => setRecoveryLog([])}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Clear Log
          </button>
        </div>
      )}

      {/* Current Mappings Display */}
      <details className="mt-4">
        <summary className="text-yellow-200 cursor-pointer hover:text-white">
          View Current Mappings ({getCurrentMappings().length})
        </summary>
        <div className="mt-2 bg-black/50 border border-gray-600 rounded p-3">
          <pre className="text-xs text-gray-300 overflow-auto">
            {JSON.stringify(getCurrentMappings(), null, 2)}
          </pre>
        </div>
      </details>
    </div>
  )
}