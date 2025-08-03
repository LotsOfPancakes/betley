// frontend/lib/hooks/useSmartApproval.ts - Fixed TypeScript issues
'use client'

import { useState, useMemo } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { isNativeHype } from '@/lib/tokenUtils'
import { ERC20_ABI } from '@/lib/contractABI'

interface UseSmartApprovalProps {
  tokenAddress: string
  amount: string
  spender: string
}

interface SmartApprovalReturn {
  needsApproval: boolean
  approve: () => Promise<void>
  isPending: boolean
  isSuccess: boolean
  skipApproval: boolean
  currentAllowance?: bigint
  error?: Error | null
}

export function useSmartApproval({ 
  tokenAddress, 
  amount, 
  spender 
}: UseSmartApprovalProps): SmartApprovalReturn {
  const { address: userAddress } = useAccount()
  const [error, setError] = useState<Error | null>(null)
  
  // Skip approval entirely for native HYPE tokens
  const skipApproval = isNativeHype(tokenAddress)
  
  // Check current allowance for ERC20 tokens only
  const { data: currentAllowance } = useReadContract({
    address: skipApproval ? undefined : tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: skipApproval || !userAddress ? undefined : [userAddress, spender as `0x${string}`],
    query: { 
      enabled: !skipApproval && !!userAddress && !!tokenAddress && !!spender,
      staleTime: 5000, // Cache for 5 seconds
    }
  })

  // Determine if new approval is needed - FIXED typing
  const needsNewApproval = useMemo(() => {
    if (skipApproval) return false // Native HYPE never needs approval
    if (!userAddress) return false
    
    // Type the currentAllowance properly
    const typedAllowance = currentAllowance as bigint | undefined
    if (!typedAllowance || !amount) return false
    
    try {
      const amountWei = parseUnits(amount, 18)
      return typedAllowance < amountWei
    } catch {
      return false // Invalid amount format
    }
  }, [skipApproval, currentAllowance, amount, userAddress])

  // Approval transaction handling
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash: txHash,
    query: { enabled: !!txHash }
  })

  // Execute approval transaction
  const approve = async () => {
    if (skipApproval || !needsNewApproval) {
      return // No approval needed
    }

    if (!userAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      setError(null)
      const amountWei = parseUnits(amount, 18)
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amountWei],
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Approval failed')
      setError(error)
      throw error
    }
  }

  return {
    needsApproval: needsNewApproval,
    approve,
    isPending: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    skipApproval,
    currentAllowance: currentAllowance as bigint | undefined,
    error: error || writeError || null
  }
}