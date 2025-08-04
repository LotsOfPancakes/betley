import { readContract } from 'wagmi/actions'
import { createConfig, http } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from './contractABI'
import { Config } from 'wagmi'
import { hyperevm } from './chains'

// ✅ Server-side wagmi config for API routes - lazy initialization with error handling
let _serverConfig: Config | null = null

export function getServerConfig(): Config {
  if (!_serverConfig) {
    try {
      _serverConfig = createConfig({
        chains: [hyperevm],
        transports: {
          [hyperevm.id]: http(),
        },
      })
    } catch (error) {
      console.error('Failed to create server config:', error)
      throw new Error('Server configuration failed - check environment variables')
    }
  }
  return _serverConfig
}

// ✅ ADD: Type definition for getBetDetails return
type BetDetailsReturn = readonly [
  string,              // name
  readonly string[],   // options  
  `0x${string}`,      // creator
  bigint,             // endTime
  boolean,            // resolved
  number,             // winningOption
  readonly bigint[],  // totalAmounts
  `0x${string}`       // token address
]

export async function fetchBetDetails(betId: number, config: Config) {
  try {
    const betDetails = await readContract(config, {
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)],
    }) as BetDetailsReturn // ✅ FIXED: Explicit type assertion
    
    return {
      id: betId,
      name: betDetails[0],
      options: betDetails[1],
      creator: betDetails[2],
      endTime: betDetails[3],
      resolved: betDetails[4],
      winningOption: betDetails[5],
      totalAmounts: betDetails[6],
      token: betDetails[7], // ✅ Now TypeScript knows this exists
    }
  } catch (error) {
    console.error(`Error fetching bet ${betId}:`, error)
    return null
  }
}

// ✅ NEW: Function to check if a bet is active (for public bets filtering)
export async function checkIfBetIsActive(betId: number, config?: Config): Promise<boolean> {
  try {
    const configToUse = config || getServerConfig()
    const betDetails = await readContract(configToUse, {
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)],
    }) as BetDetailsReturn
    
    const endTime = betDetails[3] // endTime is 4th element (index 3)
    const resolved = betDetails[4] // resolved is 5th element (index 4)
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    
    // Bet is active if: not resolved AND current time < endTime
    return !resolved && now < Number(endTime)
  } catch (error) {
    console.error(`Error checking if bet ${betId} is active:`, error)
    return false // Default to inactive on error
  }
}

// ✅ NEW: Lightweight function to get just endTime for active filtering
export async function getBetEndTime(betId: number, config?: Config): Promise<{ endTime: bigint; resolved: boolean } | null> {
  try {
    const configToUse = config || getServerConfig()
    const betDetails = await readContract(configToUse, {
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)],
    }) as BetDetailsReturn
    
    return {
      endTime: betDetails[3],
      resolved: betDetails[4]
    }
  } catch (error) {
    console.error(`Error fetching bet ${betId} end time:`, error)
    return null
  }
}