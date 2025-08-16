'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
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
  const { writeContract, isPending: isTransactionPending } = useWriteContract()
  
  const [newAddress, setNewAddress] = useState('')
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([])
  const [validationError, setValidationError] = useState('')
  
  // Database-driven state for existing addresses
  const [existingAddresses, setExistingAddresses] = useState<WhitelistedAddress[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [removingAddress, setRemovingAddress] = useState<string | null>(null)

  // Read whitelist status from contract
  const { data: whitelistEnabled, refetch: refetchWhitelistStatus } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getWhitelistStatus',
    args: [BigInt(contractBetId)],
  })

  // Check if current user address is whitelisted
  const { refetch: refetchCurrentUserStatus } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'isWhitelisted',
    args: [BigInt(contractBetId), address || '0x0'],
  })

  // Fetch existing addresses from database
  const fetchExistingAddresses = useCallback(async () => {
    if (!betId) return
    
    setIsLoadingAddresses(true)
    try {
      console.log('Fetching whitelist addresses for bet:', betId)
      
      const response = await fetch(`/api/bets/${betId}/whitelist`)
      console.log('GET Response Status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('GET Request failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('GET Error Response:', errorText)
        return
      }
      
      const data = await response.json()
      console.log('GET Response Data:', data)
      
      if (data.success) {
        console.log('Successfully fetched addresses:', data.data.addresses)
        setExistingAddresses(data.data.addresses || [])
      } else {
        console.error('GET API returned error:', data.error)
      }
    } catch (error) {
      console.error('GET Request exception:', error)
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

  const validateAddress = (addr: string): boolean => {
    if (!addr.trim()) {
      setValidationError('Address cannot be empty')
      return false
    }
    
    if (!isAddress(addr)) {
      setValidationError('Invalid Ethereum address')
      return false
    }
    
    if (whitelistAddresses.includes(addr)) {
      setValidationError('Address already in pending list')
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
      
      // 1. Contract operation (source of truth)
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'removeFromWhitelist',
        args: [BigInt(contractBetId), addressToRemove as `0x${string}`],
      })

      // 2. Database operation (convenience storage)
      console.log('Sending DELETE request with data:', {
        address: addressToRemove,
        removedBy: address,
        betId: betId
      })
      
      const response = await fetch(`/api/bets/${betId}/whitelist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: addressToRemove,
          removedBy: address 
        })
      })

      console.log('DELETE Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('DELETE Request failed:', response.status, response.statusText)
        console.error('DELETE Error Response:', errorText)
        // Don't continue if DELETE failed
        return
      }

      const result = await response.json()
      console.log('DELETE Response Data:', result)

      if (!result.success) {
        console.error('DELETE API returned error:', result.error)
        return
      }

      console.log('DELETE Success:', result.message)

      // 3. Refresh database query (should work now that DELETE succeeded)
      console.log('DELETE succeeded, now refreshing data...')
      await fetchExistingAddresses()
      await refetchWhitelistStatus()
      await refetchCurrentUserStatus()
      
    } catch (error) {
      console.error('Error removing from whitelist:', error)
    } finally {
      setRemovingAddress(null)
    }
  }

  const handleAddAddress = () => {
    if (validateAddress(newAddress)) {
      setWhitelistAddresses(prev => [...prev, newAddress])
      setNewAddress('')
    }
  }

  const handleRemoveAddress = (addressToRemove: string) => {
    setWhitelistAddresses(prev => prev.filter(addr => addr !== addressToRemove))
  }

  const handleAddToWhitelist = async () => {
    if (!address || whitelistAddresses.length === 0) return

    try {
      // 1. Contract operations (source of truth)
      for (const addr of whitelistAddresses) {
        await writeContract({
          address: BETLEY_ADDRESS,
          abi: BETLEY_ABI,
          functionName: 'addToWhitelist',
          args: [BigInt(contractBetId), addr as `0x${string}`],
        })
      }

      // 2. Database operation (convenience storage)
      console.log('Sending POST request with data:', {
        addresses: whitelistAddresses,
        addedBy: address,
        betId: betId
      })
      
      const response = await fetch(`/api/bets/${betId}/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: whitelistAddresses,
          addedBy: address
        })
      })

      console.log('POST Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('POST Request failed:', response.status, response.statusText)
        console.error('POST Error Response:', errorText)
        // Don't continue if POST failed
        return
      }

      const result = await response.json()
      console.log('POST Response Data:', result)

      if (!result.success) {
        console.error('POST API returned error:', result.error)
        return
      }

      console.log('POST Success:', result.message)

      // 3. Refresh database query (should work now that POST succeeded)
      console.log('POST succeeded, now refreshing data...')
      setWhitelistAddresses([])
      await fetchExistingAddresses()
      await refetchWhitelistStatus()
      await refetchCurrentUserStatus()
      
    } catch (error) {
      console.error('Error adding to whitelist:', error)
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
      await refetchCurrentUserStatus()
    } catch (error) {
      console.error('Error disabling whitelist:', error)
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
                disabled={isTransactionPending}
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
                disabled={!newAddress.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➕
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
                        disabled={removingAddress === addr.participant_address}
                        className="ml-3 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        {removingAddress === addr.participant_address ? '...' : '✕'}
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

          {/* Pending Addresses List */}
          {whitelistAddresses.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Pending Addresses ({whitelistAddresses.length})</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {whitelistAddresses.map((addr, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-900/30 rounded border border-blue-700"
                  >
                    <span className="text-sm font-mono text-blue-300 truncate">
                      {addr}
                    </span>
                    <button
                      onClick={() => handleRemoveAddress(addr)}
                      className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {whitelistAddresses.length > 0 && (
              <button
                onClick={handleAddToWhitelist}
                disabled={isTransactionPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isTransactionPending ? 'Adding...' : `Add ${whitelistAddresses.length} Address${whitelistAddresses.length > 1 ? 'es' : ''}`}
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Whitelisted addresses can participate in betting</p>
            <p>• Creator is automatically whitelisted</p>
            <p>• Whitelist doesn&apos;t affect claiming winnings</p>
            <p>• Leave whitelist empty for public betting</p>
          </div>
        </div>
      </div>
    </div>
  )
}