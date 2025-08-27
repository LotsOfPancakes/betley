// frontend/app/bets/[id]/hooks/useBetFeeData.ts
'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { BETLEY_ABI } from '@/lib/contractABI'
import { contractsConfig } from "@/lib/config"
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

// Type definitions for contract responses - FIXED TypeScript typing
type FeeParametersResult = readonly [boolean, bigint, boolean, bigint, string]

export function useBetFeeData(
  betId: string,
  address?: string,
  totalAmounts?: readonly bigint[],
  winningOption?: number,
  resolved?: boolean
): BetFeeData {
  
  // 🔍 DEBUG: Log all input parameters
  console.log('🔍 useBetFeeData inputs:', { 
    betId, 
    address, 
    totalAmounts: totalAmounts?.map(x => x.toString()), 
    winningOption, 
    resolved 
  })
  
  // 🔍 DEBUG: Log contract configuration
  console.log('🔍 Contract config:', { 
    contractAddress: contractsConfig.betley,
    contractsConfigExists: !!contractsConfig 
  })
  
  // Fetch contract winnings (only when resolved)
  const { 
    data: contractWinnings, 
    isLoading: isLoadingWinnings,
    error: winningsError
  } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_ABI,
    functionName: 'calculatePotentialWinnings',
    args: betId != null && betId !== '' && address ? [BigInt(betId), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && betId != null && betId !== '' && !!resolved,
      refetchInterval: 5000,
      staleTime: 30000,
    }
  })

  // 🔍 DEBUG: Log winnings contract call results
  console.log('🔍 Winnings contract call:', { 
    contractWinnings: contractWinnings?.toString(), 
    isLoadingWinnings, 
    winningsError: winningsError?.message 
  })

  // Fetch fee parameters
  const { 
    data: feeParams, 
    isLoading: isLoadingFeeParams,
    error: feeParamsError
  } = useReadContract({
    address: contractsConfig.betley,
    abi: BETLEY_ABI,
    functionName: 'getFeeParameters',
    query: {
      staleTime: 30000,
    }
  })

  // 🔍 DEBUG: Log fee parameters contract call results
  console.log('🔍 Fee params contract call:', { 
    feeParams: feeParams ? Array.from(feeParams).map((x, i) => i < 4 ? (typeof x === 'bigint' ? x.toString() : x) : x) : undefined,
    isLoadingFeeParams, 
    feeParamsError: feeParamsError?.message 
  })

  // Calculate losing pool using utility function - FIXED typing
  const losingPool = useMemo(() => {
    if (!totalAmounts || !Array.isArray(totalAmounts)) {
      return BigInt(0)
    }
    return calculateLosingPool(totalAmounts, winningOption ?? -1)
  }, [totalAmounts, winningOption])

  // 🔍 DEBUG: Log losing pool calculation
  console.log('🔍 Losing pool calculation:', { 
    totalAmounts: totalAmounts?.map(x => x.toString()), 
    winningOption, 
    losingPool: losingPool.toString() 
  })

  // Calculate fee amounts and breakdown using utility functions - FIXED typing
  const feeCalculations = useMemo(() => {
    const typedFeeParams = feeParams as FeeParametersResult | undefined
    
    if (!typedFeeParams || !losingPool) {
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

    const [creatorEnabled, creatorRate, platformEnabled, platformRate] = typedFeeParams
    
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

  // 🔍 DEBUG: Log fee calculations result
  console.log('🔍 Fee calculations result:', { 
    creatorFeeAmount: feeCalculations.creatorFeeAmount.toString(), 
    platformFeeAmount: feeCalculations.platformFeeAmount.toString(), 
    feesEnabled: feeCalculations.feesEnabled,
    feeBreakdown: {
      creatorFee: feeCalculations.feeBreakdown.creatorFee.toString(),
      platformFee: feeCalculations.feeBreakdown.platformFee.toString(),
      totalFees: feeCalculations.feeBreakdown.totalFees.toString(),
      losingPool: feeCalculations.feeBreakdown.losingPool.toString()
    }
  })

  // Determine loading state
  const isLoading = isLoadingWinnings || isLoadingFeeParams

  // Determine if we have valid data for calculations
  const hasValidData = !!(totalAmounts && winningOption !== undefined && feeParams)

  // Combine any errors
  const error = winningsError || feeParamsError || null

  // 🔍 DEBUG: Log final hook results
  console.log('🔍 useBetFeeData final results:', { 
    hasValidData, 
    isLoading, 
    error: error?.message,
    feesEnabled: feeCalculations.feesEnabled,
    creatorFeeAmount: feeCalculations.creatorFeeAmount.toString()
  })

  return {
    // Contract data - FIXED typing
    contractWinnings: contractWinnings as bigint | undefined,
    feeParams: feeParams as FeeParametersResult | undefined,
    
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