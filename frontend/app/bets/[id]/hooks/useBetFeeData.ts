// frontend/app/bets/[id]/hooks/useBetFeeData.ts
'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from '@/lib/contractABI'
import { 
  calculateLosingPool, 
  calculateAllFees 
} from '@/lib/utils/betCalculations'

interface FeeBreakdown {
  creatorFee: bigint
  platformFee: bigint
  totalFees: bigint
  losingPool: bigint
}

interface BetFeeData {
  // Contract data
  contractWinnings?: bigint
  feeParams?: readonly [boolean, bigint, boolean, bigint, string]
  
  // Calculated amounts
  creatorFeeAmount: bigint
  platformFeeAmount: bigint
  feeBreakdown: FeeBreakdown
  
  // Loading and error states
  isLoadingWinnings: boolean
  isLoadingFeeParams: boolean
  isLoading: boolean
  error?: Error | null
  
  // Helper flags
  feesEnabled: boolean
  hasValidData: boolean
}

export function useBetFeeData(
  betId: string,
  address?: string,
  totalAmounts?: readonly bigint[],
  winningOption?: number,
  resolved?: boolean
): BetFeeData {
  
  // Fetch contract winnings (only when resolved)
  const { 
    data: contractWinnings, 
    isLoading: isLoadingWinnings,
    error: winningsError
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'calculatePotentialWinnings',
    args: betId && address ? [BigInt(betId), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!betId && !!resolved,
      refetchInterval: 5000,
      staleTime: 30000,
    }
  })

  // Fetch fee parameters
  const { 
    data: feeParams, 
    isLoading: isLoadingFeeParams,
    error: feeParamsError
  } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getFeeParameters',
    query: {
      staleTime: 30000,
    }
  })

  // Calculate losing pool using utility function
  const losingPool = useMemo(() => {
    return calculateLosingPool(totalAmounts || [], winningOption || -1)
  }, [totalAmounts, winningOption])

  // Calculate fee amounts and breakdown using utility functions
  const feeCalculations = useMemo(() => {
    if (!feeParams || !losingPool) {
      return {
        creatorFeeAmount: BigInt(0),
        platformFeeAmount: BigInt(0),
        feeBreakdown: {
          creatorFee: BigInt(0),
          platformFee: BigInt(0),
          totalFees: BigInt(0),
          losingPool: BigInt(0)
        },
        feesEnabled: false
      }
    }

    const [creatorEnabled, creatorRate, platformEnabled, platformRate] = feeParams
    
    // Use utility function for all fee calculations
    const feeBreakdown = calculateAllFees(
      losingPool,
      creatorRate,
      creatorEnabled,
      platformRate,
      platformEnabled
    )

    const feesEnabled = creatorEnabled || platformEnabled

    return {
      creatorFeeAmount: feeBreakdown.creatorFee,
      platformFeeAmount: feeBreakdown.platformFee,
      feeBreakdown,
      feesEnabled
    }
  }, [feeParams, losingPool])

  // Determine loading state
  const isLoading = isLoadingWinnings || isLoadingFeeParams

  // Determine if we have valid data for calculations
  const hasValidData = !!(totalAmounts && winningOption !== undefined && feeParams)

  // Combine any errors
  const error = winningsError || feeParamsError || null

  return {
    // Contract data
    contractWinnings,
    feeParams,
    
    // Calculated amounts
    creatorFeeAmount: feeCalculations.creatorFeeAmount,
    platformFeeAmount: feeCalculations.platformFeeAmount,
    feeBreakdown: feeCalculations.feeBreakdown,
    
    // Loading and error states
    isLoadingWinnings,
    isLoadingFeeParams,
    isLoading,
    error,
    
    // Helper flags
    feesEnabled: feeCalculations.feesEnabled,
    hasValidData
  }
}

// Type export for components that need the fee breakdown structure
export type { FeeBreakdown, BetFeeData }