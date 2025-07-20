// frontend/lib/contractABI.ts - Updated for BetleyNativeV2 with Security Fixes
import { config } from './config'

// Contract addresses from config
export const BETLEY_ADDRESS = config.contracts.betley as `0x${string}`
export const HYPE_TOKEN_ADDRESS = config.contracts.hypeToken as `0x${string}`

// BetleyNativeV2 ABI - WITH SECURITY FIXES APPLIED
export const BETLEY_ABI = [
  // ========== CORE BETTING FUNCTIONS ==========
  
  // Create Bet
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_options",
        "type": "string[]"
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
  
  // ========== FEE FUNCTIONS ==========
  
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
  
  // Claim Platform Fees
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "claimPlatformFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // ========== VIEW FUNCTIONS ==========
  
  // Get Bet Details (SAME STRUCTURE AS V1 - DO NOT CHANGE ORDER)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betId",
        "type": "uint256"
      }
    ],
    "name": "getBetDetails",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
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
        "internalType": "uint256[]",
        "name": "totalAmounts",
        "type": "uint256[]"
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
  
  // Has User Claimed Winnings/Refund
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
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Has Claimed Creator Fees (M3 FIX: NEW FUNCTION)
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
        "name": "",
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
  
  // Calculate Potential Winnings (with locked fees)
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
  
  // Get Fee Parameters
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
  
  // Pending Platform Fees
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingPlatformFees",
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
  
  // Platform Fee Recipient
  {
    "inputs": [],
    "name": "platformFeeRecipient",
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
  
  // ========== ADMINISTRATIVE FUNCTIONS ==========
  
  // Update Creator Fee Settings
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "updateFeeCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Update Platform Fee Settings
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "updateFeePlatform",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Update Platform Fee Recipient
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRecipient",
        "type": "address"
      }
    ],
    "name": "updatePlatformFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Emergency Disable Fees
  {
    "inputs": [],
    "name": "emergencyDisableFees",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  
  // Transfer Ownership
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Renounce Ownership
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // ========== CONSTANTS ==========
  
  // Max Creator Fee
  {
    "inputs": [],
    "name": "MAX_CREATOR_FEE",
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
  
  // Max Platform Fee
  {
    "inputs": [],
    "name": "MAX_PLATFORM_FEE",
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
  
  // Fee Creator (enabled/disabled)
  {
    "inputs": [],
    "name": "feeCreator",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Fee Creator Amount
  {
    "inputs": [],
    "name": "feeCreatorAmount",
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
  
  // Fee Platform (enabled/disabled)
  {
    "inputs": [],
    "name": "feePlatform",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Fee Platform Amount
  {
    "inputs": [],
    "name": "feePlatformAmount",
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
  
  // ========== EVENTS ==========
  
  // Bet Created
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
        "internalType": "string",
        "name": "name",
        "type": "string"
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
  
  // Bet Placed
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
  
  // Bet Resolved
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
  
  // Winnings Claimed
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
  },
  
  // Refund Claimed
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
    "name": "RefundClaimed",
    "type": "event"
  },
  
  // Platform Fee Accumulated
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
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PlatformFeeAccumulated",
    "type": "event"
  },
  
  // Creator Fee Collected
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
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "CreatorFeeCollected",
    "type": "event"
  },
  
  // Fee Parameters Updated
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "creatorEnabled",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "creatorAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "platformEnabled",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "platformAmount",
        "type": "uint256"
      }
    ],
    "name": "FeeParametersUpdated",
    "type": "event"
  },
  
  // Ownership Transferred
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  }
]

// ERC20 ABI for token approvals (unchanged)
export const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
]