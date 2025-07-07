'use client'

import { useParams } from 'next/navigation'
import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useState, useEffect } from 'react'
import { ConnectKitButton } from 'connectkit'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'

// Sub-components for better organization
function UserPositionCard({ 
  userExistingOption, 
  options, 
  resolved, 
  winningOption, 
  decimals, 
  getUserTotalBet,
  calculateWinnings 
}: any) {
  if (userExistingOption === null) return null

  return (
    <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Your Position</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Option</p>
          <p className="font-semibold text-white">
            {options ? options[userExistingOption] : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Amount</p>
          <p className="font-semibold text-white">
            {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
          </p>
        </div>
      </div>
      {resolved && winningOption !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <p className="text-sm">
            Status: {userExistingOption === winningOption ? 
              <span className="text-green-400 font-medium">Won 🎉</span> : 
              <span className="text-red-400 font-medium">Lost</span>
            }
          </p>
          <p className="text-sm mt-1">
            Result: {userExistingOption === winningOption ? (
              <span className="text-green-400 font-medium">
                +{decimals ? formatUnits(calculateWinnings(), decimals) : '0'} HYPE
              </span>
            ) : (
              <span className="text-red-400 font-medium">
                -{decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export default function BetPage() {
  const params = useParams()
  const betId = parseInt(params.id as string)
  const { address } = useAccount()
  const [selectedOption, setSelectedOption] = useState<number>(0)
  const [betAmount, setBetAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [userExistingOption, setUserExistingOption] = useState<number | null>(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<number>(0)
  const [isResolving, setIsResolving] = useState(false)
  
  // Read bet details
  const { data: betDetails, isLoading: isBetLoading, error: betError } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: [BigInt(betId)],
  })

  // Read user's existing bets
  const { data: userBets } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address ? [BigInt(betId), address] : undefined,
  })

  // Read user's HYPE balance
  const { data: hypeBalance } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETLEY_ADDRESS] : undefined,
  })

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  // Check if user can claim
  const { data: hasClaimed } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && betDetails && betDetails[4] ? [BigInt(betId), address] : undefined,
  })

  // Read resolution deadline
  const { data: resolutionDeadline } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getResolutionDeadline',
    args: [BigInt(betId)],
  })

  const { writeContract, isPending } = useWriteContract()

  // Set user's existing option when user bets are loaded
  useEffect(() => {
    if (userBets && userBets.length > 0) {
      // Find which option the user has bet on
      const existingOption = userBets.findIndex((amount: bigint) => amount > BigInt(0))
      if (existingOption !== -1) {
        setUserExistingOption(existingOption)
        setSelectedOption(existingOption) // Pre-select their existing option
      }
    }
  }, [userBets])

  const handleApprove = async () => {
    if (!betAmount || !decimals) return
    
    // Check if user is trying to bet on wrong option
    if (userExistingOption !== null && selectedOption !== userExistingOption) {
      alert('You can only bet on your existing option')
      return
    }
    
    setIsApproving(true)
    
    try {
      await writeContract({
        address: HYPE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS, parseUnits(betAmount, decimals)],
      }, {
        onSuccess: () => {
          setTimeout(() => {
            refetchAllowance() // Refetch allowance after approval
            setIsApproving(false)
          }, 2000)
        },
        onError: () => {
          setIsApproving(false)
        }
      })
    } catch {
      setIsApproving(false)
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || !decimals) return
    
    const amount = parseFloat(betAmount)
    if (amount <= 0) {
      alert('Please enter an amount greater than 0')
      return
    }
    
    // Check if user is trying to bet on wrong option
    if (userExistingOption !== null && selectedOption !== userExistingOption) {
      alert('You can only bet on your existing option')
      return
    }
    
    await writeContract({
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'placeBet',
      args: [BigInt(betId), selectedOption, parseUnits(betAmount, decimals)],
    })
  }

  // Check if user needs to approve
  const needsApproval = () => {
    if (!allowance || !betAmount || !decimals) return true
    try {
      const requiredAmount = parseUnits(betAmount || '0', decimals)
      return allowance < requiredAmount
    } catch {
      return true
    }
  }

  // Loading state
  if (isBetLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4 text-white">Loading bet #{betId}...</p>
          <p className="text-gray-300">Make sure bet exists and contract is deployed correctly</p>
          <p className="text-sm text-gray-400 mt-2">Contract: {BETLEY_ADDRESS}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (betError || !betDetails) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error loading bet #{betId}</p>
          <p className="text-gray-300">This bet might not exist yet.</p>
          <p className="text-sm text-gray-400 mt-4">Contract: {BETLEY_ADDRESS}</p>
          {betError && (
            <p className="text-sm text-red-400 mt-2">Error: {betError.message}</p>
          )}
        </div>
      </div>
    )
  }

  // Derive values from betDetails after all hooks
  const [name, options, creator, endTime, resolved, winningOption, totalAmounts] = betDetails || []
  const timeLeft = endTime ? Number(endTime) - Math.floor(Date.now() / 1000) : 0
  const isActive = timeLeft > 0
  
  // Calculate resolution deadline time
  const resolutionTimeLeft = resolutionDeadline ? Number(resolutionDeadline) - Math.floor(Date.now() / 1000) : 0
  const resolutionDeadlinePassed = resolutionTimeLeft <= 0
  
  // Format time display
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`
    }
    return `${hours}h ${minutes}m`
  }

  const handleResolveBet = async () => {
    setIsResolving(true)
    try {
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'resolveBet',
        args: [BigInt(betId), selectedWinner],
      })
      setShowResolveModal(false)
    } catch (error) {
      console.error('Error resolving bet:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const handleClaimWinnings = async () => {
    await writeContract({
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(betId)],
    })
  }

  const userCanClaim = () => {
    if (!userBets || hasClaimed) return false
    
    // If resolution deadline passed and not resolved, anyone with bets can claim
    if (resolutionDeadlinePassed && !resolved) {
      return userBets.some((amount: bigint) => amount > BigInt(0))
    }
    
    // Normal claim: only winners after resolution
    if (!resolved || winningOption === undefined) return false
    return userBets[winningOption] > BigInt(0)
  }
  
  const getUserTotalBet = () => {
    if (!userBets) return BigInt(0)
    return userBets.reduce((sum: bigint, amount: bigint) => sum + amount, BigInt(0))
  }

  const calculateWinnings = () => {
    if (!resolved || !userBets || winningOption === undefined || !totalAmounts) return BigInt(0)
    
    const userWinningBet = userBets[winningOption]
    if (userWinningBet === BigInt(0)) return BigInt(0)
    
    const totalWinningPool = totalAmounts[winningOption]
    let totalLosingPool = BigInt(0)
    
    for (let i = 0; i < totalAmounts.length; i++) {
      if (i !== winningOption) {
        totalLosingPool += totalAmounts[i]
      }
    }
    
    if (totalLosingPool === BigInt(0)) {
      return userWinningBet // Just return original bet if no losers
    }
    
    return userWinningBet + (userWinningBet * totalLosingPool / totalWinningPool)
  }

  const calculatePotentialWinnings = (betAmountStr: string, optionIndex: number) => {
    if (!betAmountStr || !totalAmounts || !decimals) return '0'
    
    try {
      const betAmount = parseUnits(betAmountStr, decimals)
      const existingUserBet = userBets && userBets[optionIndex] ? userBets[optionIndex] : BigInt(0)
      const totalBetAmount = existingUserBet + betAmount
      
      // Calculate new total for this option
      const newOptionTotal = totalAmounts[optionIndex] + betAmount
      
      // Calculate losing pool (all other options)
      let losingPool = BigInt(0)
      for (let i = 0; i < totalAmounts.length; i++) {
        if (i !== optionIndex) {
          losingPool += totalAmounts[i]
        }
      }
      
      if (losingPool === BigInt(0)) {
        return formatUnits(totalBetAmount, decimals) // Just return bet if no other bets
      }
      
      // Calculate winnings: original bet + proportional share of losing pool
      const winnings = totalBetAmount + (totalBetAmount * losingPool / newOptionTotal)
      const profit = winnings - totalBetAmount
      
      return formatUnits(profit, decimals)
    } catch {
      return '0'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Betley</h1>
          {address && hypeBalance !== undefined && decimals && (
            <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="font-semibold text-white">{formatUnits(hypeBalance, decimals)} HYPE</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">{name}</h2>
          
          <div className="mb-6 space-y-2">
            <p className="text-gray-600">Created by: {creator?.slice(0, 6)}...{creator?.slice(-4)}</p>
            <p className="text-gray-600">
              Time left: {timeLeft > 0 ? `${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m` : 'Ended'}
            </p>
            {resolved && <p className="text-green-600 font-bold">Resolved - Winner: {options[winningOption]}</p>}
          </div>

          {address && hypeBalance !== undefined && decimals && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Your HYPE Balance: {formatUnits(hypeBalance, decimals)} HYPE
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            {options.map((option, index) => (
              <div key={index} className="border rounded-lg p-4 hover:border-blue-400 transition-colors">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="option"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => {
                        if (userExistingOption !== null && userExistingOption !== index) {
                          // Don't allow changing to a different option
                          return
                        }
                        setSelectedOption(index)
                      }}
                      disabled={!isActive}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-lg">{option}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{decimals ? formatUnits(totalAmounts[index], decimals) : '0'} HYPE</p>
                    <p className="text-sm text-gray-600">Total bet</p>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {isActive && address && (
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount in HYPE"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
              />
              
              {needsApproval() ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isPending || !betAmount}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isApproving || isPending ? 'Approving...' : 'Approve HYPE'}
                </button>
              ) : (
                <button
                  onClick={handlePlaceBet}
                  disabled={isPending || !betAmount}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Placing Bet...' : 'Place Bet'}
                </button>
              )}
            </div>
          )}

          {!address && (
            <div className="text-center">
              <p className="text-gray-300 mb-4">Connect your wallet to place a bet</p>
              <ConnectKitButton />
            </div>
          )}

          {address && !isActive && timeLeft > 0 && (
            <p className="text-center text-gray-300">Betting hasn't started yet</p>
          )}

          {address && timeLeft <= 0 && !resolved && (
            <p className="text-center text-gray-300">Betting has ended. Waiting for resolution...</p>
          )}

          {/* Resolution Section for Creator */}
          {address && creator && address.toLowerCase() === creator.toLowerCase() && timeLeft <= 0 && !resolved && !resolutionDeadlinePassed && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-300 mb-3">As the creator, you can now resolve this bet:</p>
              <p className="text-sm text-yellow-200 mb-3">Time remaining: {formatTimeRemaining(resolutionTimeLeft)}</p>
              <button
                onClick={() => setShowResolveModal(true)}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Resolve Bet
              </button>
            </div>
          )}

          {/* Refund Section when deadline passed */}
          {resolutionDeadlinePassed && !resolved && userCanClaim() && (
            <div className="mt-6 p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
              <p className="text-orange-300 mb-3">
                The resolution deadline has passed. You can claim a refund of your original bet.
              </p>
              <p className="text-sm text-orange-200 mb-3">
                Your total bet: {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
              </p>
              <button
                onClick={handleClaimWinnings}
                disabled={isPending}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-600 transition-colors"
              >
                {isPending ? 'Claiming Refund...' : 'Claim Refund'}
              </button>
            </div>
          )}

          {/* Claim Winnings Section */}
          {resolved && userCanClaim() && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-green-300 mb-3">Congratulations! You won this bet.</p>
              <button
                onClick={handleClaimWinnings}
                disabled={isPending}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 transition-colors"
              >
                {isPending ? 'Claiming...' : 'Claim Winnings'}
              </button>
            </div>
          )}

          {hasClaimed && (
            <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
              <p className="text-gray-300">
                ✅ You have already claimed your {resolved ? 'winnings' : 'refund'}
              </p>
            </div>
          )}
        </div>

        {/* Resolution Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Resolve Bet</h3>
              <p className="text-gray-300 mb-4">Select the winning option:</p>
              
              <div className="space-y-2 mb-6">
                {options && options.map((option, index) => (
                  <label key={index} className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                    <input
                      type="radio"
                      name="winner"
                      value={index}
                      checked={selectedWinner === index}
                      onChange={() => setSelectedWinner(index)}
                      className="mr-3"
                    />
                    <span className="text-white">{option}</span>
                    <span className="ml-auto text-gray-400">
                      {formatUnits(totalAmounts[index], decimals || 18)} HYPE
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveBet}
                  disabled={isResolving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
                >
                  {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Betting History Table */}
      {totalAmounts && options && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Betting Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Option</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Total Bets</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Your Bet</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option, index) => {
                    const userAmount = userBets && userBets[index] ? userBets[index] : BigInt(0)
                    
                    return (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{option}</td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {decimals ? formatUnits(totalAmounts[index], decimals) : '0'} HYPE
                        </td>
                        <td className="py-3 px-4 text-right">
                          {userAmount > BigInt(0) && (
                            <span className="text-blue-400 font-medium">
                              {decimals ? formatUnits(userAmount, decimals) : '0'} HYPE
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="font-semibold">
                    <td className="py-3 px-4 text-white">Total</td>
                    <td className="py-3 px-4 text-right text-white">
                      {decimals && totalAmounts ? 
                        formatUnits(totalAmounts.reduce((a: bigint, b: bigint) => a + b, BigInt(0)), decimals) : 
                        '0'
                      } HYPE
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">
                      {decimals ? formatUnits(getUserTotalBet(), decimals) : '0'} HYPE
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}