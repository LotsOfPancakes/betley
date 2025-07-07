export const BETLEY_ADDRESS = '0xCFf7b01Fe9838a913C2Bc06499C3CBEA169D1725' // REPLACE WITH YOUR NEW DEPLOYED CONTRACT ADDRESS!

export const HYPE_TOKEN_ADDRESS = '0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C'

export const BETLEY_ABI = [
  {
    inputs: [{ name: '_hypeToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_options', type: 'string[]' },
      { name: '_duration', type: 'uint256' }
    ],
    name: 'createBet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_option', type: 'uint8' },
      { name: '_amount', type: 'uint256' }
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'getBetDetails',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'options', type: 'string[]' },
      { name: 'creator', type: 'address' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningOption', type: 'uint8' },
      { name: 'totalAmounts', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'betCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    name: 'getUserBets',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    name: 'hasUserClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_betId', type: 'uint256' },
      { name: '_winningOption', type: 'uint8' }
    ],
    name: 'resolveBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_betId', type: 'uint256' }],
    name: 'getResolutionDeadline',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'creator', type: 'address' }
    ],
    name: 'BetCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: false, name: 'user', type: 'address' },
      { indexed: false, name: 'option', type: 'uint8' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'BetPlaced',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: false, name: 'winningOption', type: 'uint8' }
    ],
    name: 'BetResolved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: false, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'WinningsClaimed',
    type: 'event'
  }
] as const

export const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const