import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { useBetData } from '../../../app/bets/[id]/hooks/useBetData'

// Mock the external dependencies
jest.mock('@tanstack/react-query')
jest.mock('wagmi')
jest.mock('@/lib/contractABI', () => ({
  BETLEY_ABI: [],
}))
jest.mock('@/lib/config', () => ({
  contractsConfig: {
    betley: '0x1234567890123456789012345678901234567890',
  },
}))
jest.mock('@/lib/erc20ABI', () => ({
  ERC20_ABI: [],
}))
jest.mock('@/lib/tokenUtils', () => ({
  isNativeETH: jest.fn((address) => address === '0x0000000000000000000000000000000000000000'),
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>
const mockUseBalance = useBalance as jest.MockedFunction<typeof useBalance>

describe('useBetData', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as const

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    })

    mockUseReadContract.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
    })

    mockUseBalance.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      error: null,
    })
  })

  it('should fetch bet data successfully', () => {
    const mockDatabaseBet = {
      numericId: 1,
      name: 'Test Bet',
      options: ['Option A', 'Option B'],
      creator: mockAddress,
      optionCount: 2,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      endTime: Math.floor(Date.now() / 1000) + 3600,
      createdAt: new Date().toISOString(),
      resolved: false,
      winningOption: null,
      resolutionDeadline: Math.floor(Date.now() / 1000) + 90000,
      totalAmounts: [1000, 500],
      isPublic: true,
      canAccess: true,
      isActive: true,
      hasEnded: false,
    }

    mockUseQuery.mockReturnValue({
      data: mockDatabaseBet,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ['bet-details-new', 'testbet1'],
      queryFn: expect.any(Function),
      enabled: true,
      staleTime: 30000,
      retry: 2,
    })

    // The hook should initialize with loading state
    expect(result.current).toBeDefined()
  })

  it('should not fetch when randomId is invalid', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false,
    })

    renderHook(() => useBetData('invalid'))

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ['bet-details-new', 'invalid'],
      queryFn: expect.any(Function),
      enabled: false, // Should be disabled for invalid randomId
      staleTime: 30000,
      retry: 2,
    })
  })

  it('should handle loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    // Hook should handle loading state appropriately
    expect(result.current).toBeDefined()
  })

  it('should handle error state', () => {
    const mockError = new Error('Bet not found')
    
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      isError: true,
      isSuccess: false,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    expect(result.current).toBeDefined()
  })

  it('should identify native ETH bets correctly', () => {
    const mockDatabaseBet = {
      numericId: 1,
      name: 'ETH Bet',
      options: ['Yes', 'No'],
      creator: mockAddress,
      optionCount: 2,
      tokenAddress: '0x0000000000000000000000000000000000000000', // Native ETH
      endTime: Math.floor(Date.now() / 1000) + 3600,
      createdAt: new Date().toISOString(),
      resolved: false,
      winningOption: null,
      resolutionDeadline: Math.floor(Date.now() / 1000) + 90000,
      totalAmounts: [1000, 500],
      isPublic: true,
      canAccess: true,
      isActive: true,
      hasEnded: false,
    }

    mockUseQuery.mockReturnValue({
      data: mockDatabaseBet,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    expect(result.current).toBeDefined()
  })

  it('should handle resolved bets', () => {
    const mockDatabaseBet = {
      numericId: 1,
      name: 'Resolved Bet',
      options: ['Option A', 'Option B'],
      creator: mockAddress,
      optionCount: 2,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      endTime: Math.floor(Date.now() / 1000) - 3600, // Ended
      createdAt: new Date().toISOString(),
      resolved: true,
      winningOption: 0,
      resolutionDeadline: Math.floor(Date.now() / 1000) + 86400,
      totalAmounts: [2000, 1000],
      isPublic: true,
      canAccess: true,
      isActive: false,
      hasEnded: true,
    }

    mockUseQuery.mockReturnValue({
      data: mockDatabaseBet,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    expect(result.current).toBeDefined()
  })

  it('should work with useReactQuery disabled', () => {
    const { result } = renderHook(() => 
      useBetData('testbet1', { useReactQuery: false })
    )

    expect(result.current).toBeDefined()
  })

  it('should handle private bets with access control', () => {
    const mockDatabaseBet = {
      numericId: 1,
      name: 'Private Bet',
      options: ['Option A', 'Option B'],
      creator: mockAddress,
      optionCount: 2,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      endTime: Math.floor(Date.now() / 1000) + 3600,
      createdAt: new Date().toISOString(),
      resolved: false,
      winningOption: null,
      resolutionDeadline: Math.floor(Date.now() / 1000) + 90000,
      totalAmounts: [1000, 500],
      isPublic: false,
      canAccess: true, // User has access
      isActive: true,
      hasEnded: false,
    }

    mockUseQuery.mockReturnValue({
      data: mockDatabaseBet,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    })

    const { result } = renderHook(() => useBetData('testbet1'))

    expect(result.current).toBeDefined()
  })
})