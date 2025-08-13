// frontend/lib/contractABI-new.ts
// New Privacy-Focused Betley Contract ABI and Configuration

// Contract addresses - UPDATE THESE TO NEW DEPLOYED CONTRACT
export const BETLEY_NEW_ADDRESS = '0xE4cBF75D535F62B84B6D6680dd25AE5A18a903F9' as `0x${string}`
export const MOCKERC20_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

// New minimal ABI with privacy-focused functions
export const BETLEY_NEW_ABI = [
  // ========== CORE BETTING FUNCTIONS ==========
  
  // Create Bet (minimal data)
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "_optionCount",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "createBet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Place Bet
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_option",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  
  // Resolve Bet
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_winningOption",
        "type": "uint8"
      }
    ],
    "name": "resolveBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Claim Winnings
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "claimWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Claim Refund
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Claim Creator Fees
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "claimCreatorFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // ========== NEW MINIMAL VIEW FUNCTIONS ==========
  
  // Get Basic Bet Info (no sensitive data)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "getBetBasics",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "resolved",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "winningOption",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "optionCount",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Get Bet Amounts
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "getBetAmounts",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Check if Betting is Active
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "canPlaceBet",
    "outputs": [
      {
        "internalType": "bool",
        "name": "canBet",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Get User Bets
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserBets",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Check if User Claimed
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "hasUserClaimed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "claimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Check if creator has claimed fees
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "hasClaimedCreatorFees",
    "outputs": [
      {
        "internalType": "bool",
        "name": "claimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Get Resolution Deadline
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "getResolutionDeadline",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Calculate Potential Winnings
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "calculatePotentialWinnings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "winnings",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // ========== ADMINISTRATIVE FUNCTIONS ==========
  
  // Bet Counter
  {
    "inputs": [],
    "name": "betCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Fee Functions
  {
    "inputs": [],
    "name": "getFeeParameters",
    "outputs": [
      {
        "internalType": "bool",
        "name": "creatorEnabled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "creatorAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "platformEnabled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "platformAmount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Owner
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // ========== EVENTS ==========
  
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "optionCount",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "BetCreated",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "option",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "winningOption",
        "type": "uint8"
      }
    ],
    "name": "BetResolved",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "WinningsClaimed",
    "type": "event"
  }
] as const

// ERC20 ABI (unchanged)
export const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const