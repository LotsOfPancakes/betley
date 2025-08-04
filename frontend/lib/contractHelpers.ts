import { readContract } from 'wagmi/actions'
import { createConfig, http } from 'wagmi'
import { BETLEY_ABI, BETLEY_ADDRESS } from './contractABI'
import { Config } from 'wagmi'
import { hyperevm } from './chains'

// ✅ Server-side wagmi config for API routes - lazy initialization with error handling
let _serverConfig: Config | null = null

export function getServerConfig(): Config {
  console.log('=== WAGMI SERVER CONFIG INVESTIGATION ===')
  
  if (!_serverConfig) {
    try {
      console.log('Creating new server config...')
      
      // Check imports
      console.log('hyperevm chain:', hyperevm)
      console.log('hyperevm.id:', hyperevm.id)
      console.log('hyperevm.rpcUrls:', hyperevm.rpcUrls)
      
      // Check if createConfig and http are available
      console.log('createConfig function:', typeof createConfig)
      console.log('http function:', typeof http)
      
      // Try creating the config step by step
      console.log('Creating transports...')
      const transports = {
        [hyperevm.id]: http()
      }
      console.log('Transports created:', transports)
      
      console.log('Creating wagmi config...')
      _serverConfig = createConfig({
        chains: [hyperevm],
        transports: transports,
      })
      console.log('Server config created successfully:', !!_serverConfig)
      
    } catch (error) {
      console.error('💥 ERROR creating server config:', error)
      console.error('Error stack:', error.stack)
      throw new Error(`Server configuration failed: ${error.message}`)
    }
  } else {
    console.log('Using existing server config')
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
  console.log(`=== CONTRACT CALL INVESTIGATION (Bet ${betId}) ===`)
  
  try {
    console.log('Getting config...')
    const configToUse = config || getServerConfig()
    console.log('Config obtained:', !!configToUse)
    
    console.log('Contract details:')
    console.log('  BETLEY_ADDRESS:', BETLEY_ADDRESS)
    console.log('  BETLEY_ABI length:', BETLEY_ABI.length)
    console.log('  Bet ID:', betId, typeof betId)
    
    console.log('Calling readContract...')
    const betDetails = await readContract(configToUse, {
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)],
    }) as BetDetailsReturn
    
    console.log('Contract call successful, processing response...')
    
    return {
      endTime: betDetails[3],
      resolved: betDetails[4]
    }
  } catch (error) {
    console.error(`💥 ERROR in getBetEndTime for bet ${betId}:`, error)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return null
  }
}