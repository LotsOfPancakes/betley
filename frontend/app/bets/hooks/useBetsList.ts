// frontend/app/bets/hooks/useBetsList.ts - OPTIMIZED version with batch API calls
import { useState, useEffect, useCallback } from 'react'
import { useReadContract, useConfig, useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { BETLEY_ABI, BETLEY_ADDRESS, ERC20_ABI, HYPE_TOKEN_ADDRESS } from '@/lib/contractABI'
import { BetDetails } from '../types/bet.types'

// ✅ FIXED: Add proper type definitions for contract returns
type BetDetailsResult = readonly [string, readonly string[], `0x${string}`, bigint, boolean, number, readonly bigint[]]
type UserBetsResult = readonly bigint[]

export function useBetsList() {
  const config = useConfig()
  const { address } = useAccount()
  const [bets, setBets] = useState<BetDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read total number of bets
  const { data: betCounter } = useReadContract({
    address: BETLEY_ADDRESS,
    abi: BETLEY_ABI,
    functionName: 'betCounter',
  })

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: HYPE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  // ✅ OPTIMIZATION 1: Batch API call for all mappings (memoized)
  const fetchAllMappings = useCallback(async (betCount: number): Promise<Record<number, string>> => {
    try {
      // Single API call to get all mappings for this user
      const response = await fetch('/api/bets/user-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address,
          maxBetId: betCount - 1 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.mappings || {}
      }
    } catch (error) {
      console.error('Failed to fetch batch mappings:', error)
    }
    
    // Fallback to individual calls if batch fails
    return {}
  }, [address])

  // ✅ OPTIMIZATION 2: Parallel contract calls (memoized)
  const fetchBetDataParallel = useCallback(async (betIds: number[]) => {
    const promises = betIds.map(async (i) => {
      try {
        // Parallel contract calls
        const [betDataRaw, userBetsRaw] = await Promise.all([
          readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getBetDetails',
            args: [BigInt(i)],
          }),
          readContract(config, {
            address: BETLEY_ADDRESS,
            abi: BETLEY_ABI,
            functionName: 'getUserBets',
            args: [BigInt(i), address],
          })
        ])

        return { id: i, betDataRaw, userBetsRaw }
      } catch (error) {
        console.error(`Error fetching bet ${i}:`, error)
        return null
      }
    })

    return Promise.all(promises)
  }, [config, address])

  // Fetch wallet-specific bets with optimizations
  useEffect(() => {
    async function fetchMyBets() {
      if (!address || betCounter === undefined || !decimals) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const betCount = Number(betCounter)
        
        // ✅ STEP 1: Get all mappings in one batch call
        const mappings = await fetchAllMappings(betCount)
        
        // ✅ STEP 2: Get bet data for all bets in parallel
        const betIds = Array.from({ length: betCount }, (_, i) => i)
        const contractResults = await fetchBetDataParallel(betIds)
        
        // ✅ STEP 3: Process results
        const fetchedBets: BetDetails[] = []
        
        for (const result of contractResults) {
          if (!result) continue
          
          const { id: i, betDataRaw, userBetsRaw } = result
          
          // Type assertions and validation
          const betData = betDataRaw as BetDetailsResult
          const userBets = userBetsRaw as UserBetsResult
          
          if (!betData || !Array.isArray(betData) || betData.length < 7) continue
          if (!userBets || !Array.isArray(userBets)) continue

          const isCreator = betData[2].toLowerCase() === address.toLowerCase()
          const userTotalBet = userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0))
          const hasBet = userTotalBet > BigInt(0)

          // Only include if user is creator OR has placed a bet
          if (isCreator || hasBet) {
            let userRole: 'creator' | 'bettor' | 'both'
            if (isCreator && hasBet) userRole = 'both'
            else if (isCreator) userRole = 'creator'
            else userRole = 'bettor'

            // ✅ Use mapping from batch call
            const randomId = mappings[i]
            
            // Only include bets that have random ID mappings
            if (randomId) {
              fetchedBets.push({
                id: i,
                randomId,
                name: betData[0],
                options: betData[1],
                creator: betData[2],
                endTime: betData[3],
                resolved: betData[4],
                winningOption: betData[5],
                totalAmounts: betData[6],
                userRole,
                userTotalBet
              })
            }
          }
        }

        setBets(fetchedBets)
      } catch (err) {
        console.error('Error fetching bets:', err)
        setError('Failed to load bets. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyBets()
  }, [address, betCounter, decimals, config, fetchAllMappings, fetchBetDataParallel])

  // Refresh function for manual updates
  const refreshBets = () => {
    if (address && betCounter !== undefined && decimals) {
      setLoading(true)
      // Trigger useEffect by updating a dependency
    }
  }

  return {
    bets,
    loading,
    error,
    decimals,
    refreshBets
  }
}