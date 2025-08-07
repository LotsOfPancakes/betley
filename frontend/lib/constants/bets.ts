export const BET_CONSTANTS = {
  timeouts: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    resolutionDeadline: 48 * 60 * 60 * 1000, // 48 hours in milliseconds
  },
  retry: {
    maxAttempts: 3,
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  status: {
    colors: {
      resolved: 'bg-green-600',
      expired: 'bg-gray-600', 
      refundAvailable: 'bg-yellow-600',
      active: 'bg-blue-600',
      pending: 'bg-yellow-600',
    },
    labels: {
      resolved: 'Resolved',
      expired: 'Expired',
      refundAvailable: 'Refund Available',
      active: 'Active',
      pending: 'Pending Resolution',
    }
  },
  defaults: {
    decimals: 18,
    retryAttempt: 0,
  }
} as const

export type BetStatus = keyof typeof BET_CONSTANTS.status.colors