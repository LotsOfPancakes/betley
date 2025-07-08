'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { useRouter } from 'next/navigation'
import { BetIdMapper } from '@/lib/betIdMapping'

export default function SetupPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [betName, setBetName] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState({ hours: 24, minutes: 0 })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Get the current bet counter to predict the next bet ID
  const { data: betCounter, refetch: refetchBetCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  const calculateDuration = () => {
    const totalMinutes = duration.hours * 60 + duration.minutes
    if (totalMinutes <= 0) {
      return BigInt(0) // This will trigger validation error
    }
    return BigInt(totalMinutes * 60) // Convert minutes to seconds
  }

  const handleCreateBet = async () => {
    // Validation
    if (!betName.trim()) {
      alert('Please enter a bet name')
      return
    }
    
    const filledOptions = options.filter(opt => opt.trim())
    if (filledOptions.length < 2) {
      alert('Please provide at least 2 options')
      return
    }

    const durationInSeconds = calculateDuration()
    if (durationInSeconds === BigInt(0)) {
      alert('Please set a duration for the bet (minimum 1 minute)')
      return
    }

    if (!address) {
      alert('Please connect your wallet')
      return
    }

    // Debug log the duration
    console.log(`Creating bet with duration: ${duration.hours}h ${duration.minutes}m = ${Number(durationInSeconds)} seconds`)

    try {
      // Refresh bet counter before creating to get accurate next ID
      await refetchBetCounter()
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'createBet',
        args: [
          betName,
          filledOptions,
          durationInSeconds
        ],
      })
    } catch (err) {
      console.error('Error creating bet:', err)
    }
  }

  // Handle successful bet creation
  useEffect(() => {
    if (isSuccess && receipt && betCounter !== undefined && address) {
      // The new bet ID will be the current counter value (since it increments after creation)
      const newNumericBetId = Number(betCounter)
      
      console.log(`Bet created successfully! Numeric ID: ${newNumericBetId}`)
      
      // Create the mapping between random ID and numeric ID
      const randomId = BetIdMapper.addMapping(newNumericBetId, betName, address)
      
      console.log(`Random ID generated: ${randomId}`)
      console.log(`Mapping saved: ${randomId} -> ${newNumericBetId}`)
      
      // Verify the mapping was saved
      const verifyMapping = BetIdMapper.getNumericId(randomId)
      console.log(`Verification: ${randomId} maps to ${verifyMapping}`)
      
      // Redirect to the bet page using the random ID
      setTimeout(() => {
        router.push(`/bets/${randomId}`)
      }, 2000)
    }
  }, [isSuccess, receipt, betCounter, betName, address, router])

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Create New Bet</h1>
          <ConnectKitButton />
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          {!address ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">Connect your wallet to create a bet</p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Privacy Notice */}
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-2">🔒 Privacy Protection</h3>
                <p className="text-blue-200 text-sm">
                  Your bet will be assigned a unique, random 8-character ID for privacy. 
                  Only people with the direct link will be able to access your bet.
                </p>
              </div>

              {/* Bet Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Title
                </label>
                <input
                  type="text"
                  value={betName}
                  onChange={(e) => setBetName(e.target.value)}
                  placeholder="Will it rain tomorrow?"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">{betName.length}/100 characters</p>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Betting Options (2-4 options)
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        maxLength={50}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 4 && (
                  <button
                    onClick={addOption}
                    className="mt-3 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Betting Duration
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="168"
                      value={duration.hours}
                      onChange={(e) => setDuration({...duration, hours: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={duration.minutes}
                      onChange={(e) => setDuration({...duration, minutes: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Total: {duration.hours * 60 + duration.minutes} minutes
                  {duration.hours === 0 && duration.minutes === 0 && (
                    <span className="text-red-400 ml-2">⚠️ Please set a duration</span>
                  )}
                </p>
                
                {/* Quick duration buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setDuration({ hours: 0, minutes: 5 })}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    5min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration({ hours: 1, minutes: 0 })}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    1h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration({ hours: 24, minutes: 0 })}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    1d
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration({ hours: 168, minutes: 0 })}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    1w
                  </button>
                </div>
              </div>

              {/* Debug Info */}
              {betCounter !== undefined && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">
                    💡 Next bet will be assigned contract ID #{Number(betCounter)} with a random URL ID
                  </p>
                </div>
              )}

              {/* Status Messages */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">Error: {error.message}</p>
                </div>
              )}

              {isPending && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-300 text-sm">Waiting for wallet confirmation...</p>
                </div>
              )}

              {isConfirming && (
                <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-blue-300 text-sm">Creating bet... Please wait.</p>
                </div>
              )}

              {isSuccess && (
                <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">
                    ✅ Bet created successfully! Creating random ID and redirecting...
                  </p>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateBet}
                disabled={isPending || isConfirming || !address}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Creating Private Bet...' : 'Create Private Bet'}
              </button>

              {/* Privacy Info */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                <p className="text-gray-300 text-xs">
                  💡 <strong>Privacy Note:</strong> Your bet will have a unique random ID that makes it impossible 
                  for others to discover by guessing. Only share the direct link with people you want to participate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}