'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/src/lib/contractABI'
import { isAddress } from 'viem'

interface WhitelistModalProps {
  isOpen: boolean
  onClose: () => void
  betId: string
  contractBetId: number
}

interface WhitelistedAddress {
  participant_address: string
  added_at: string
  added_by: string
}



export default function WhitelistModal({ isOpen, onClose, betId, contractBetId }: WhitelistModalProps) {
  const { address } = useAccount()
  const { writeContract, data: txHash, isPending: isTransactionPending } = useWriteContract()
  
  // Transaction receipt monitoring
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    data: receipt 
  } = useWaitForTransactionReceipt({ hash: txHash })
  
  const [newAddress, setNewAddress] = useState('')
  const [validationError, setValidationError] = useState('')
  
  // Database-driven state for existing addresses
  const [existingAddresses, setExistingAddresses] = useState<WhitelistedAddress[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [removingAddress, setRemovingAddress] = useState<string | null>(null)
  
  // Transaction tracking state
  const [currentOperation, setCurrentOperation] = useState<'add' | 'remove' | null>(null)
  const [pendingAddresses, setPendingAddresses] = useState<string[]>([])
  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<string | null>(null)

  // Read whitelist status from contract
  const { data: whitelistEnabled, refetch: refetchWhitelistStatus } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getWhitelistStatus',
    args: [BigInt(contractBetId)],
  })



  // Fetch existing addresses from database
  const fetchExistingAddresses = useCallback(async () => {
    if (!betId) return
    
    setIsLoadingAddresses(true)
    try {
      const response = await fetch(`/api/bets/${betId}/whitelist`)
      
      if (!response.ok) {
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setExistingAddresses(data.data.addresses || [])
      }
    } catch (error) {
      // Silent error handling for production
    } finally {
      setIsLoadingAddresses(false)
    }
  }, [betId])

  // Load addresses when modal opens
  useEffect(() => {
    if (isOpen && betId) {
      fetchExistingAddresses()
    }
  }, [isOpen, betId, fetchExistingAddresses])

  // Handle transaction confirmation and database updates
  useEffect(() => {
    if (isConfirmed && receipt && currentOperation) {
      const operation = currentOperation
      
      // Handle database updates ONLY after blockchain confirmation
      ;(async () => {
        try {
          if (operation === 'add' && pendingAddresses.length > 0) {
            // Add to database
            await fetch(`/api/bets/${betId}/whitelist`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                addresses: pendingAddresses,
                addedBy: address
              })
            })
          } 
          else if (operation === 'remove' && pendingRemoveAddress) {
            // Remove from database
            await fetch(`/api/bets/${betId}/whitelist`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: pendingRemoveAddress,
                removedBy: address
              })
            })
          }
          
          // Refresh UI to show updated state
          await fetchExistingAddresses()
          
        } catch (error) {
          // Silent error handling for production
        } finally {
          // Clean up transaction state
          setCurrentOperation(null)
          setPendingAddresses([])
          setPendingRemoveAddress(null)
          setRemovingAddress(null)
        }
      })()
    }
  }, [isConfirmed, receipt, currentOperation, pendingAddresses, pendingRemoveAddress, address, betId, fetchExistingAddresses])

  const validateAddress = (addr: string): boolean => {
    if (!addr.trim()) {
      setValidationError('Address cannot be empty')
      return false
    }
    
    if (!isAddress(addr)) {
      setValidationError('Invalid Ethereum address')
      return false
    }
    


    if (existingAddresses.some(existing => existing.participant_address.toLowerCase() === addr.toLowerCase())) {
      setValidationError('Address already whitelisted')
      return false
    }
    
    setValidationError('')
    return true
  }

  const handleRemoveFromWhitelist = async (addressToRemove: string) => {
    if (!address || removingAddress) return

    try {
      setRemovingAddress(addressToRemove)
      setCurrentOperation('remove')
      setPendingRemoveAddress(addressToRemove)
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'removeFromWhitelist',
        args: [BigInt(contractBetId), addressToRemove as `0x${string}`],
      })
      
    } catch (error) {
      setCurrentOperation(null)
      setPendingRemoveAddress(null)
      setRemovingAddress(null)
    }
  }

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress) || !address) return

    try {
      setCurrentOperation('add')
      setPendingAddresses([newAddress])
      
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'addToWhitelist',
        args: [BigInt(contractBetId), newAddress as `0x${string}`],
      })
      
      setNewAddress('')
      
    } catch (error) {
      setCurrentOperation(null)
      setPendingAddresses([])
    }
  }



  const handleDisableWhitelist = async () => {
    if (!address) return

    try {
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'disableWhitelist',
        args: [BigInt(contractBetId)],
      })
      
      await refetchWhitelistStatus()
    } catch (error) {
      // Silent error handling for production
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAddress()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            👥 Manage Whitelist
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Whitelist Status */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {whitelistEnabled ? '🔒' : '🔓'}
              </span>
               <span className="text-sm font-medium text-white">
                 Whitelist is {whitelistEnabled ? 'enabled' : 'disabled'}
               </span>
            </div>
            
            {whitelistEnabled && (
              <button
                onClick={handleDisableWhitelist}
                disabled={isTransactionPending || isConfirming}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 transition-colors disabled:opacity-50"
              >
                Disable
              </button>
            )}
          </div>

          {/* Add New Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Add Address to Whitelist</label>
            <div className="flex gap-2">
              <input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => {
                  setNewAddress(e.target.value)
                  setValidationError('')
                }}
                onKeyPress={handleKeyPress}
                className={`flex-1 px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationError ? 'border-red-500' : 'border-gray-600'}`}
              />
              <button
                onClick={handleAddAddress}
                disabled={!newAddress.trim() || currentOperation === 'add'}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentOperation === 'add' ? (isConfirming ? '⏳' : '...') : '➕'}
              </button>
            </div>
            {validationError && (
              <p className="text-sm text-red-400">{validationError}</p>
            )}
          </div>

          {/* Current Whitelisted Addresses */}
          {whitelistEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Current Whitelisted Addresses ({existingAddresses.length})
              </label>
              
              {isLoadingAddresses ? (
                <div className="p-4 text-center text-gray-400">Loading addresses...</div>
              ) : existingAddresses.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {existingAddresses.map((addr) => (
                    <div
                      key={addr.participant_address}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-mono text-white truncate block">
                          {addr.participant_address}
                        </span>
                        <span className="text-xs text-gray-400">
                          Added {new Date(addr.added_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromWhitelist(addr.participant_address)}
                        disabled={currentOperation === 'remove' && pendingRemoveAddress === addr.participant_address}
                        className="ml-3 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        {currentOperation === 'remove' && pendingRemoveAddress === addr.participant_address ? 
                          (isConfirming ? '⏳' : '...') : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400 bg-gray-800 rounded-lg">
                  No addresses whitelisted yet
                </div>
              )}
            </div>
          )}



          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>• If enabled, only Whitelisted addresses can participate in betting</p>
            <p>• Leave whitelist empty & disabled for public betting</p>
          </div>
        </div>
      </div>
    </div>
  )
}