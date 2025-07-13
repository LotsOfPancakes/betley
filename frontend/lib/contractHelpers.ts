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
      endTime: betDetails[3],
      resolved: betDetails[4],
      winningOption: betDetails[5],
      totalAmounts: betDetails[6],
    }
  } catch (error) {
    console.error(`Error fetching bet ${betId}:`, error)
    return null
  }
}