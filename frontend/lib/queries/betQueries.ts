// lib/queries/betQueries.ts - Fixed TypeScript issues
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'
import { useNotification } from '@/lib/hooks/useNotification'

// ✅ FIXED: Add proper type definitions
type BetDetailsResult = readonly [string, readonly string[], `0x${string}`, bigint, boolean, number, readonly bigint[]]
type UserBetsResult = readonly bigint[]
type AddressType = `0x${string}`

// Bet Details Query
export function useBetDetailsQuery(betId: number) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: betId >= 0 ? [BigInt(betId)] : undefined,
    query: {
      enabled: betId >= 0,
      staleTime: 5000,
      refetchInterval: () => 8000,
    }
  })
}

// User Bets Query
export function useUserBetsQuery(betId: number, address?: AddressType) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address && betId >= 0 ? [BigInt(betId), address as AddressType] : undefined,
    query: {
      enabled: betId >= 0 && !!address,
      staleTime: 8000,
      refetchInterval: 10000,
    }
  })
}

// User Balance Query
export function useUserBalanceQuery(address?: AddressType) {
  return useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as AddressType] : undefined,
    query: {
      enabled: !!address,
      staleTime: 10000,
      refetchInterval: 15000,
    }
  })
}

// User Allowance Query
export function useUserAllowanceQuery(address?: AddressType) {
  return useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address as AddressType, BETLEY_ADDRESS as AddressType] : undefined,
    query: {
      enabled: !!address,
      staleTime: 7000,
      refetchInterval: 12000,
    }
  })
}

// User Claimed Query
export function useUserClaimedQuery(betId: number, address?: AddressType) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && betId >= 0 ? [BigInt(betId), address as AddressType] : undefined,
    query: {
      enabled: betId >= 0 && !!address,
      staleTime: 15000,
      refetchInterval: 20000,
    }
  })
}

// Token Decimals Query
export function useTokenDecimalsQuery() {
  return useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      staleTime: Infinity, // Decimals never change
    }
  })
}

// ===== MUTATIONS =====

// Place Bet Mutation
export function usePlaceBetMutation(betId: number) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { writeContract } = useWriteContract()

  return useMutation({
    mutationFn: async ({ option, amount }: { option: number; amount: string }) => {
      const decimals = 18 // HYPE token decimals
      const amountWei = parseUnits(amount, decimals)
      
      return writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'placeBet',
        args: [BigInt(betId), option, amountWei],
      })
    },
    onSuccess: () => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['bet', betId] })
      queryClient.invalidateQueries({ queryKey: ['userBets', betId] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      
      showSuccess('Your bet has been placed successfully!')
    },
    onError: (error) => {
      console.error('Place bet error:', error)
      showError(
        'Failed to place bet. Please check your wallet and try again.',
        'Transaction Failed'
      )
    }
  })
}

// Approve Token Mutation
export function useApproveMutation() {
  const queryClient = useQueryClient()
  const { showError } = useNotification()
  const { writeContract } = useWriteContract()

  return useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      const decimals = 18 // HYPE token decimals
      const amountWei = parseUnits(amount, decimals)
      
      return writeContract({
        address: HYPE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS as AddressType, amountWei],
      })
    },
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['allowance'] })
  // ✅ No immediate success toast - let the user see wallet confirmation
},
    onError: (error) => {
      console.error('Approval error:', error)
      showError(
        'Failed to approve tokens. Please try again.',
        'Approval Failed'
      )
    }
  })
}

// Claim Winnings Mutation
export function useClaimWinningsMutation(betId: number) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { writeContract } = useWriteContract()

  return useMutation({
    mutationFn: async () => {
      return writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(betId)],
      })
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['claimed', betId] })
      
      showSuccess('Your winnings have been claimed successfully!')
    },
    onError: (error) => {
      console.error('Claim winnings error:', error)
      showError(
        'Failed to claim winnings. You may have already claimed or the bet is not resolved.',
        'Claim Failed'
      )
    }
  })
}

// Resolve Bet Mutation (for creators)
export function useResolveBetMutation(betId: number) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { writeContract } = useWriteContract()

  return useMutation({
    mutationFn: async ({ winningOptionIndex }: { winningOptionIndex: number }) => {
      return writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'resolveBet',
        args: [BigInt(betId), winningOptionIndex],
      })
    },
    onSuccess: () => {
      // Invalidate bet details to show resolved state
      queryClient.invalidateQueries({ queryKey: ['bet', betId] })
      
      showSuccess('Bet has been resolved successfully!')
    },
    onError: (error) => {
      console.error('Resolve bet error:', error)
      showError(
        'Failed to resolve bet. Make sure you are the creator and the betting period has ended.',
        'Resolution Failed'
      )
    }
  })
}

// ===== HELPER FUNCTIONS =====

// Safe data extraction helpers
export function extractBetDetails(data: unknown): BetDetailsResult | null {
  if (!data || !Array.isArray(data) || data.length < 7) return null
  return data as unknown as BetDetailsResult // Add 'unknown' intermediate cast
}

export function extractUserBets(data: unknown): UserBetsResult | null {
  if (!data || !Array.isArray(data)) return null
  return data as UserBetsResult
}

// Type guards for safer data access
export function isBetDetailsValid(data: unknown): data is BetDetailsResult {
  return Array.isArray(data) && data.length >= 7
}

export function isUserBetsValid(data: unknown): data is UserBetsResult {
  return Array.isArray(data) && data.every(item => typeof item === 'bigint')
}