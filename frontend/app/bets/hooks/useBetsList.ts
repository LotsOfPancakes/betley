// frontend/app/bets/hooks/useBetsList.ts - Fixed with unified mapping
import { useState, useEffect } from 'react'
import { useReadContract, useConfig, useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { BETLEY_ABI, BETLEY_ADDRESS, ERC20_ABI, HYPE_TOKEN_ADDRESS } from '@/lib/contractABI'
import { UnifiedBetMapper } from '@/lib/betIdMapping'  // Use unified system
import { BetDetails } from '../types/bet.types'

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

  // Fetch wallet-specific bets
  useEffect(() => {
    async function fetchMyBets() {
      if (!address || betCounter === undefined || !decimals) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const fetchedBets: BetDetails[] = []

        for (let i = 0; i < Number(betCounter); i++) {
          try {
            // Get bet details
            const betData = await readContract(config, {
              address: BETLEY_ADDRESS,
              abi: BETLEY_ABI,
              functionName: 'getBetDetails',
              args: [BigInt(i)],
            })

            if (!betData) continue

            // Check if user has bet on this
            const userBets = await readContract(config, {
              address: BETLEY_ADDRESS,
              abi: BETLEY_ABI,
              functionName: 'getUserBets',
              args: [BigInt(i), address],
            })

            const isCreator = betData[2].toLowerCase() === address.toLowerCase()
            const userTotalBet = userBets ? 
              userBets.reduce((total: bigint, amount: bigint) => total + amount, BigInt(0)) : BigInt(0)
            const hasBet = userTotalBet > BigInt(0)

            // Only include if user is creator OR has placed a bet
            if (isCreator || hasBet) {
              let userRole: 'creator' | 'bettor' | 'both'
              if (isCreator && hasBet) userRole = 'both'
              else if (isCreator) userRole = 'creator'
              else userRole = 'bettor'

              // Get random ID using unified system (returns string | undefined)
              const randomId = UnifiedBetMapper.getRandomId(i)

              fetchedBets.push({
                id: i,
                randomId, // ✅ Now correctly typed as string | undefined
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
          } catch (err) {
            console.error(`Error fetching bet ${i}:`, err)
            // Continue with other bets even if one fails
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
  }, [address, betCounter, decimals, config])

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