'use client'

import { useState } from 'react'
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [betName, setBetName] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState({ hours: 24, minutes: 0 })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
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
    return BigInt((duration.hours * 3600) + (duration.minutes * 60))
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
      alert('Please set a duration for the bet')
      return
    }

    try {
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

  // Redirect to bet page after successful creation
  if (isSuccess && hash) {
    setTimeout(() => {
      router.push('/bets')
    }, 2000)
  }

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
              {/* Bet Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Name
                </label>
                <input
                  type="text"
                  value={betName}
                  onChange={(e) => setBetName(e.target.value)}
                  placeholder="e.g., Will BTC hit $100k by end of month?"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Betting Options ({options.length} of 2-4)
                  </label>
                  {options.length < 4 && (
                    <button
                      onClick={addOption}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Betting Duration
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={duration.hours}
                      onChange={(e) => setDuration({ ...duration, hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Hours</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={duration.minutes}
                      onChange={(e) => setDuration({ ...duration, minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Minutes</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Betting starts immediately upon creation
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="font-medium text-white mb-2">Summary</h3>
                <p className="text-sm text-gray-300">
                  Betting starts: Immediately
                </p>
                <p className="text-sm text-gray-300">
                  Betting ends: In {duration.hours}h {duration.minutes}m
                </p>
                <p className="text-sm text-gray-300">
                  Resolution deadline: 72 hours after betting ends
                </p>
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-lg text-sm border border-red-800">
                  Error: {error.message}
                </div>
              )}

              {/* Success message */}
              {isSuccess && (
                <div className="bg-green-900/20 text-green-400 p-4 rounded-lg text-sm border border-green-800">
                  Bet created successfully! Redirecting...
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateBet}
                disabled={isPending || isConfirming}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Creating Bet...' : 'Create Bet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}