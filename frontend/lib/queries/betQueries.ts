// lib/queries/betQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { BETLEY_ABI, BETLEY_ADDRESS, HYPE_TOKEN_ADDRESS, ERC20_ABI } from '@/lib/contractABI'

// ===== QUERY KEYS =====
// These help React Query organize and invalidate cached data
export const betQueryKeys = {
  all: ['bets'] as const,
  bet: (id: number) => [...betQueryKeys.all, 'bet', id] as const,
  betDetails: (id: number) => [...betQueryKeys.bet(id), 'details'] as const,
  userBets: (id: number, address: string) => [...betQueryKeys.bet(id), 'userBets', address] as const,
  userClaimed: (id: number, address: string) => [...betQueryKeys.bet(id), 'claimed', address] as const,
  userBalance: (address: string) => ['user', address, 'balance'] as const,
  userAllowance: (address: string) => ['user', address, 'allowance'] as const,
}

// ===== ENHANCED READ HOOKS =====
// These wrap useReadContract with better caching and automatic refetching

export function useBetDetailsQuery(betId: number) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getBetDetails',
    args: betId >= 0 ? [BigInt(betId)] : undefined,
    query: {
      enabled: betId >= 0,
      staleTime: 5000, // Data stays fresh for 5 seconds
      refetchInterval: (data) => {
        // Refetch resolved bets less frequently
        if (data && data[4]) return 30000 // 30 seconds for resolved bets
        return 8000 // 8 seconds for active bets
      },
    }
  })
}

export function useUserBetsQuery(betId: number, address?: string) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'getUserBets',
    args: address && betId >= 0 ? [BigInt(betId), address] : undefined,
    query: {
      enabled: !!address && betId >= 0,
      staleTime: 3000,
      refetchInterval: 15000,
    }
  })
}

export function useUserBalanceQuery(address?: string) {
  return useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 10000, // 10 seconds
      refetchInterval: 30000, // 30 seconds
    }
  })
}

export function useUserAllowanceQuery(address?: string) {
  return useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETLEY_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      staleTime: 5000,
      refetchInterval: 20000,
    }
  })
}

export function useUserClaimedQuery(betId: number, address?: string) {
  return useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'hasUserClaimed',
    args: address && betId >= 0 ? [BigInt(betId), address] : undefined,
    query: {
      enabled: !!address && betId >= 0,
      staleTime: 10000,
      refetchInterval: 25000,
    }
  })
}

// ===== MUTATION HOOKS =====
// These handle blockchain writes with optimistic updates

export function usePlaceBetMutation(betId: number) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mutation = useMutation({
    mutationFn: async ({ option, amount }: { option: number; amount: string }) => {
      const amountBigInt = parseUnits(amount, 18)
      
      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'placeBet',
        args: [BigInt(betId), option, amountBigInt],
      })
      
      return { option, amount: amountBigInt }
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches for this bet
      await queryClient.cancelQueries({ queryKey: betQueryKeys.bet(betId) })

      // Optimistically update bet totals in cache
      queryClient.setQueryData(betQueryKeys.betDetails(betId), (old: any) => {
        if (!old || !old[6]) return old
        
        const newTotalAmounts = [...old[6]]
        newTotalAmounts[variables.option] = (newTotalAmounts[variables.option] || BigInt(0)) + variables.amount
        
        return [
          old[0], // name
          old[1], // options  
          old[2], // creator
          old[3], // endTime
          old[4], // resolved
          old[5], // winningOption
          newTotalAmounts, // updated totalAmounts
        ]
      })

      return { previousData: queryClient.getQueryData(betQueryKeys.betDetails(betId)) }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(betQueryKeys.betDetails(betId), context.previousData)
      }
      console.error('Place bet error:', err)
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: betQueryKeys.bet(betId) })
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.includes('balance')
      })
    },
  })

  return {
    ...mutation,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}

export function useApproveMutation() {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      const amountBigInt = parseUnits(amount, 18)
      
      writeContract({
        address: HYPE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BETLEY_ADDRESS, amountBigInt],
      })
      
      return { amount: amountBigInt }
    },
    onSuccess: () => {
      // Invalidate all allowance queries when approval succeeds
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.includes('allowance')
      })
    },
    onError: (err) => {
      console.error('Approval error:', err)
    },
  })

  return {
    ...mutation,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}

export function useClaimWinningsMutation(betId: number) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mutation = useMutation({
    mutationFn: async () => {
      writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(betId)],
      })
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: betQueryKeys.bet(betId) })
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.includes('balance')
      })
    },
    onError: (err) => {
      console.error('Claim winnings error:', err)
    },
  })

  return {
    ...mutation,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}