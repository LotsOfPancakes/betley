import { readContract } from 'wagmi/actions'
import { BETLEY_ABI, BETLEY_ADDRESS } from './contractABI'

import { Config } from 'wagmi'
export async function fetchBetDetails(betId: number, config: Config) {
  try {
    const betDetails = await readContract(config, {
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'getBetDetails',
      args: [BigInt(betId)],
    })
    
    return {
      id: betId,
      name: betDetails[0],
      options: betDetails[1],
      creator: betDetails[2],
      startTime: betDetails[3],
      endTime: betDetails[4],
      resolved: betDetails[5],
      winningOption: betDetails[6],
      totalAmounts: betDetails[7],
    }
  } catch (error) {
    console.error(`Error fetching bet ${betId}:`, error)
    return null
  }
}