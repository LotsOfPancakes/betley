import { formatUnits } from 'viem'

interface BetHeaderProps {
  address?: string
  hypeBalance?: bigint
  decimals?: number
}

export function BetHeader({ 
  address, 
  hypeBalance, 
  decimals 
}: BetHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-white">Betley</h1>
      {address && hypeBalance !== undefined && decimals && (
        <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Balance</p>
          <p className="font-semibold text-white">{formatUnits(hypeBalance, decimals)} HYPE</p>
        </div>
      )}
    </div>
  )
}