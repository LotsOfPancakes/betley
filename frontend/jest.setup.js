import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder (needed for viem)
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for crypto (needed for viem)
const crypto = require('crypto')
Object.defineProperty(global, 'crypto', {
  value: {
    ...crypto,
    getRandomValues: (arr) => crypto.randomFillSync(arr),
    randomUUID: crypto.randomUUID,
    subtle: crypto.webcrypto?.subtle,
    web: crypto.webcrypto,
  },
})

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),
  useConnect: jest.fn(() => ({
    connect: jest.fn(),
    connectors: [],
    error: null,
    isLoading: false,
    pendingConnector: null,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useBalance: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
  })),
  useContractRead: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
  })),
  useContractWrite: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
    write: jest.fn(),
  })),
  usePrepareContractWrite: jest.fn(() => ({
    config: {},
    error: null,
    isError: false,
    isIdle: true,
    isLoading: false,
    isSuccess: false,
  })),
  useWaitForTransaction: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
    isSuccess: false,
  })),
}))

// Create mock functions for modules that might not exist
global.__SUPABASE_MOCK__ = {
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithCustomToken: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: false,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: false,
  })),
  QueryClient: jest.fn(() => ({
    clear: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (
    args[0]?.includes?.('React.createFactory') ||
    args[0]?.includes?.('Warning: ReactDOM.render')
  ) {
    return
  }
  originalConsoleWarn(...args)
}