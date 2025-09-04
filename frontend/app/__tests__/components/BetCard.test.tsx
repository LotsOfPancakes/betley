import React from 'react'
import { render, screen } from '@testing-library/react'
import BetCard from '../../bets/components/BetCard'
import type { UnifiedBet } from '../../bets/types/bet.types'

// Mock the utility functions
jest.mock('@/lib/utils/bettingUtils', () => ({
  formatDynamicDecimals: jest.fn((value) => value),
}))

jest.mock('@/lib/utils/tokenFormatting', () => ({
  getTokenSymbol: jest.fn((isNative) => isNative ? 'ETH' : 'TOKEN'),
}))

jest.mock('@/lib/constants/bets', () => ({
  BET_CONSTANTS: {
    status: {
      labels: {
        active: 'Active',
        pending: 'Pending Resolution',
        resolved: 'Resolved',
        expired: 'Expired',
        refundAvailable: 'Refund Available',
      },
      colors: {
        active: 'text-green-500',
        pending: 'text-yellow-500',
        resolved: 'text-blue-500',
        expired: 'text-gray-500',
        refundAvailable: 'text-orange-500',
      },
    },
    timeouts: {
      resolutionDeadline: 86400000, // 24 hours in ms
    },
  },
}))

jest.mock('@/lib/tokenUtils', () => ({
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
}))

// Mock Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href} data-testid="bet-card-link">{children}</a>
  }
})

describe('BetCard', () => {
  const mockBet: UnifiedBet = {
    randomId: 'test-random-id',
    name: 'Test Bet',
    description: 'Test Description',
    options: ['Option A', 'Option B'],
    endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    totalAmounts: [1000000000000000000, 500000000000000000], // 1 ETH, 0.5 ETH in wei
    resolved: false,
    winningOption: null,
    userRole: 'bettor',
    token: null,
  }

  const defaultProps = {
    bet: mockBet,
    decimals: 18,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders bet card with basic information', () => {
    render(<BetCard {...defaultProps} />)
    
    expect(screen.getByText('Test Bet')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows resolved status for resolved bet', () => {
    const resolvedBet: UnifiedBet = {
      ...mockBet,
      resolved: true,
      winningOption: 0,
    }

    render(<BetCard bet={resolvedBet} decimals={18} />)
    
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('displays user role correctly', () => {
    render(<BetCard {...defaultProps} />)
    
    expect(screen.getByText('Bettor')).toBeInTheDocument()
  })

  it('creates correct link to bet page', () => {
    render(<BetCard {...defaultProps} />)
    
    const link = screen.getByTestId('bet-card-link')
    expect(link).toHaveAttribute('href', '/bets/test-random-id')
  })

  it('does not render when randomId is missing', () => {
    const betWithoutId: UnifiedBet = {
      ...mockBet,
      randomId: '',
    }

    const { container } = render(<BetCard bet={betWithoutId} decimals={18} />)
    
    expect(container.firstChild).toBeNull()
  })
})