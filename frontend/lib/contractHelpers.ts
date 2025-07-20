import { readContract } from 'wagmi/actions'
import { BETLEY_ABI, BETLEY_ADDRESS } from './contractABI'
import { Config } from 'wagmi'

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