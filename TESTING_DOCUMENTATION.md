# Betley Testing Documentation

## Overview
This document provides comprehensive documentation for Betley's testing infrastructure, covering both smart contract and frontend testing implementations.

## 🎯 Testing Strategy Summary

### Test Coverage Status
- **Smart Contracts**: ✅ **FULLY IMPLEMENTED** - 21 tests covering all core functionality
- **Frontend**: ✅ **FOUNDATION READY** - Jest + React Testing Library configured, sample tests created

## 🔧 Smart Contract Tests (Solidity/Foundry)

### Location
- **Directory**: `/contracts/test/`
- **Framework**: Foundry (Forge)
- **Language**: Solidity ^0.8.20

### Test Files Structure
```
contracts/test/
├── mocks/
│   └── MockERC20.sol          # ERC20 token mock for testing
└── Betley.t.sol               # Main test suite (21 tests)
```

### Test Coverage Breakdown

#### 1. **Bet Creation Tests** (4 tests)
- ✅ `testCreateBetBasic` - Basic bet creation with valid parameters
- ✅ `testCreateBetWithERC20` - ERC20 token bet creation
- ✅ `testCreateBetWithWhitelist` - Whitelisted bet creation
- ✅ `testCreateBetInvalidParameters` - Input validation (invalid options, zero duration)

#### 2. **Bet Placement Tests** (4 tests)
- ✅ `testPlaceBetNative` - Native ETH betting
- ✅ `testPlaceBetERC20` - ERC20 token betting
- ✅ `testPlaceBetMultipleUsers` - Multi-user betting scenarios
- ✅ `testPlaceBetInvalidConditions` - Error conditions (expired, resolved bets)

#### 3. **Bet Resolution Tests** (4 tests)
- ✅ `testResolveBet` - Successful bet resolution
- ✅ `testResolveBetOnlyCreator` - Access control validation
- ✅ `testResolveBetInvalidOption` - Invalid winning option handling
- ✅ `testResolveBetNoWinningBets` - Resolution validation

#### 4. **Winnings & Refunds Tests** (4 tests)
- ✅ `testClaimWinnings` - Successful winnings claiming
- ✅ `testClaimWinningsInvalidCases` - Error handling (no bet, double claim)
- ✅ `testClaimRefund` - Refund mechanism after deadline
- ✅ `testClaimRefundInvalidCases` - Refund validation

#### 5. **Whitelist Management Tests** (1 test)
- ✅ `testWhitelistFunctionality` - Add/remove whitelist addresses

#### 6. **View Functions Tests** (3 tests)
- ✅ `testCanPlaceBet` - Betting eligibility checking
- ✅ `testCanUserPlaceBet` - User-specific betting eligibility
- ✅ `testCalculatePotentialWinnings` - Winnings calculation preview

#### 7. **Integration Tests** (1 test)
- ✅ `testCompleteBettingFlow` - End-to-end betting workflow

### Gas Usage Benchmarks
```
Contract Deployment: 4,783,311 gas
Average Function Costs:
- createBet: ~133,508 gas
- placeBet: ~77,732 gas
- resolveBet: ~57,347 gas
- claimWinnings: ~58,905 gas
```

### Running Smart Contract Tests
```bash
cd contracts
forge test                    # Run all tests
forge test -v                 # Verbose output
forge test --gas-report      # Include gas usage
forge test --match-test testName  # Run specific test
```

## 🎨 Frontend Tests (React/TypeScript)

### Location
- **Directory**: `/frontend/`
- **Framework**: Jest + React Testing Library
- **Language**: TypeScript

### Test Configuration
```
frontend/
├── jest.config.js           # Jest configuration
├── jest.setup.js           # Test environment setup
├── app/__tests__/          # App Router component tests
└── src/__tests__/          # Source code tests
```

### Test Infrastructure

#### Jest Configuration (`jest.config.js`)
- ✅ Next.js integration with `next/jest`
- ✅ TypeScript support
- ✅ Module path mapping (`@/*` aliases)
- ✅ Coverage collection setup

#### Test Environment (`jest.setup.js`)
- ✅ React Testing Library DOM extensions
- ✅ Next.js router mocking (Pages + App Router)
- ✅ wagmi hooks mocking (wallet integration)
- ✅ Supabase client mocking
- ✅ React Query mocking
- ✅ Web APIs polyfills (TextEncoder, crypto, etc.)

### Sample Tests Implemented

#### Component Tests
- ✅ **BetCard.test.tsx** - Core betting interface component
  - Basic rendering validation
  - Status display testing
  - User role handling
  - Link generation testing

#### Hook Tests  
- ✅ **useBetDataNew.test.ts** - Critical data fetching hook
  - Data fetching validation
  - Error state handling
  - Loading state management
  - Cache behavior testing

### Frontend Test Categories (Planned)

#### 1. **Component Tests** (Priority: High)
```
✅ BetCard.tsx                 # Core bet display
🔄 UnifiedBettingInterface.tsx # Betting interface
🔄 BetStatusHeader.tsx         # Status display
🔄 Navigation.tsx              # App navigation
```

#### 2. **Hook Tests** (Priority: High)
```
✅ useBetDataNew.ts           # Bet data fetching
🔄 useBetActionsNew.ts        # Bet actions
🔄 useBetCreationNew.ts       # Bet creation
🔄 useSmartApproval.ts        # ERC20 approvals
```

#### 3. **API Route Tests** (Priority: Medium)
```
🔄 /api/bets/create           # Bet creation
🔄 /api/bets/place            # Place bets
🔄 /api/bets/resolve          # Resolve bets
🔄 /api/bets/public           # Public listings
```

#### 4. **Utility Tests** (Priority: Medium)
```
🔄 betCalculations.ts         # Math functions
🔄 tokenFormatting.ts         # Display formatting
🔄 winningsCalculator.ts      # Payout calculations
```

### Running Frontend Tests
```bash
cd frontend
npm test                      # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
npm test -- --verbose       # Detailed output
```

## 🏗️ Test Architecture Patterns

### Smart Contract Testing Patterns

#### 1. **Setup Pattern**
```solidity
function setUp() public {
    vm.startPrank(owner);
    betley = new Betley();
    mockToken = new MockERC20("Test Token", "TEST");
    vm.stopPrank();
    
    // Fund test accounts
    deal(user1, INITIAL_BALANCE);
    mockToken.mint(user1, INITIAL_BALANCE);
}
```

#### 2. **Helper Functions**
```solidity
function createTestBet() internal returns (uint256) {
    vm.prank(creator);
    return betley.createBet(2, 1 hours, address(0), new address[](0));
}
```

#### 3. **Event Testing**
```solidity
vm.expectEmit(true, true, false, true);
emit BetCreated(0, creator, 2, address(0));
```

### Frontend Testing Patterns

#### 1. **Component Testing**
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<Component {...props} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

#### 2. **Hook Testing**
```typescript
const { result } = renderHook(() => useCustomHook(params))
expect(result.current.data).toBeDefined()
```

#### 3. **Mock Patterns**
```typescript
jest.mock('@/lib/utils', () => ({
  utilFunction: jest.fn(() => 'mocked result'),
}))
```

## 🎯 Test Execution Guide

### Development Workflow
1. **Smart Contract Changes**: Run `forge test` to ensure contract integrity
2. **Frontend Changes**: Run `npm test` for component/hook validation  
3. **Integration Testing**: Manual testing of complete user flows
4. **Pre-deployment**: Full test suite execution with gas reports

### Continuous Integration
- ✅ Smart contract tests run on every commit
- ✅ Frontend tests configured for CI/CD
- ✅ Gas usage monitoring
- ✅ Coverage reporting

## 📊 Test Metrics & Coverage

### Current Coverage
- **Smart Contract Functions**: 100% (all public functions tested)
- **Frontend Components**: 15% (foundation established)
- **Critical User Flows**: 80% (core betting workflow)

### Quality Metrics
- **Smart Contract Tests**: 21/21 passing ✅
- **Test Execution Time**: <1 second (contracts), ~2 seconds (frontend)
- **Gas Optimization**: All functions under acceptable limits

## 🔮 Future Testing Roadmap

### Phase 1: Core Coverage (Completed)
- ✅ Smart contract comprehensive testing
- ✅ Frontend testing foundation
- ✅ CI/CD integration

### Phase 2: Frontend Expansion (Next)
- 🔄 Complete component test coverage
- 🔄 API route testing
- 🔄 Integration test scenarios

### Phase 3: Advanced Testing (Future)
- 🔄 E2E testing with Playwright
- 🔄 Performance benchmarks
- 🔄 Security testing automation
- 🔄 Fuzz testing for contracts

## 🛠️ Development Guidelines

### Adding New Tests

#### Smart Contract Tests
1. Add test function with descriptive name
2. Use helper functions for common operations
3. Test both success and failure cases
4. Verify event emissions
5. Check state changes

#### Frontend Tests  
1. Mock external dependencies
2. Test component rendering and behavior
3. Verify user interactions
4. Handle loading/error states
5. Ensure accessibility compliance

### Test Maintenance
- **Regular Updates**: Keep tests updated with feature changes
- **Mock Management**: Update mocks when external APIs change
- **Performance**: Monitor test execution time
- **Coverage**: Maintain >80% coverage on critical paths

## 📚 Resources & References

### Documentation
- [Foundry Testing](https://book.getfoundry.sh/forge/writing-tests)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools Used
- **Foundry**: Ethereum testing framework
- **Jest**: JavaScript testing framework  
- **React Testing Library**: React component testing
- **wagmi**: Ethereum hooks (mocked in tests)
- **Supabase**: Database client (mocked in tests)

---

*This documentation is maintained alongside the codebase and updated with each major testing implementation.*