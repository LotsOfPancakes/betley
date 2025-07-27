# Betley - Decentralized Betting Platform

**🎯 Live at: [https://www.betley.xyz](https://www.betley.xyz)**

A production-ready pari-mutuel style betting platform built on HyperEVM testnet using HYPE tokens.

## 🌟 Features
- **Custom Bets**: Create bets with 2-4 custom options and flexible duration
- **Dual Token Support**: Bet with native HYPE or other ERC20 tokens (later phases)
- **Pari-Mutuel Payouts**: Automatic fair distribution based on betting pools
- **Privacy-First**: Random bet IDs prevent enumeration and protect user privacy
- **Auto-Resolution**:48-hour resolution deadline with automatic refund system
- **Mobile Optimized**: Responsive design with PWA capabilities
- **Fee System**: 1% creator and 0.5% platform fees

## 🚀 Live Platform
- **Production**: [https://www.betley.xyz](https://www.betley.xyz)
- **Staging**: [https://betley.vercel.app](https://betley.vercel.app)
- **Blockchain**: HyperEVM Testnet
- **Contract**: `0x3eB11c552cc4259730f14b8b88dEEF06f78A7913`

## 🛠️ Tech Stack
- **Smart Contracts**: Solidity + Foundry
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Web3**: Wagmi v2, Viem, ConnectKit
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: HyperEVM Testnet
- **Deployment**: Vercel with custom domain

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Foundry (for smart contract development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd betley
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your environment variables
   ```

4. **Start development server**
   ```bash
   cd frontend
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Smart Contract Development

### Setup
```bash
cd contracts
forge install
forge build
```

### Testing
```bash
forge test -vvv
```

### Deployment
```bash
# Deploy to HyperEVM testnet
forge script script/DeployBetley.s.sol \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
  --broadcast \
  --verify
```

### Fee Configuration
```bash
# View current fee status
forge script script/ConfigureFees.s.sol:ViewFees \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm

# Enable fees (when ready); change RPC accordingly
forge script script/ConfigureFees.s.sol:EnableFees \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
  --broadcast
```

## 📝 Environment Variables

### Required Variables
```env
# Core Configuration
NEXT_PUBLIC_BETLEY_ADDRESS=0x88598D1EfC9032318FB7B39DCdD9E5c2a7a4F8b9
NEXT_PUBLIC_CHAIN_ID=998
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://www.betley.xyz
NEXT_PUBLIC_BASE_URL=https://www.betley.xyz

# Contract Deployment
PRIVATE_KEY=your-private-key-for-deployment
```

## 🏗️ Architecture Overview

### Frontend Architecture
- **App Router**: Next.js 15 with TypeScript
- **State Management**: React Query + React hooks
- **Styling**: Tailwind CSS with custom design system
- **Web3 Integration**: Wagmi v2 with ConnectKit
- **Error Handling**: Multiple-level error boundaries

### Smart Contract Architecture
- **Pari-Mutuel Logic**: Fair payout calculation based on pool sizes
- **Fee System**: Optional creator (1%) and platform (0.5%) fees
- **Security**: ReentrancyGuard, access controls, comprehensive validation
- **Token Support**: Native HYPE for now

### Database Schema
- **Bet Mappings**: Random ID ↔ Numeric ID for privacy
- **Caching Strategy**: React Query with optimized cache times
- **Privacy**: No sensitive bet data stored, only ID mappings

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
pnpm test        # Unit tests
pnpm test:e2e    # End-to-end tests
pnpm lint        # ESLint
pnpm type-check  # TypeScript validation
```

### Smart Contract Testing
```bash
cd contracts
forge test -vvv                    # All tests with verbose output
forge test --match-test testBet    # Specific test pattern
forge coverage                     # Coverage report
```

## 📊 Performance Metrics

### Current Performance
- **Page Load Time**: ~1.5 seconds
- **API Response Time**: ~80ms average
- **Error Rate**: <0.05%
- **Mobile Performance Score**: 92/100

### Caching Strategy
- **Bet Data**: 30-second cache with background refresh
- **User Balances**: 10-second cache with optimistic updates
- **Bet Mappings**: 5-minute cache (rarely changes)

## 🔐 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Controls**: Owner-only functions for fee management
- **Input Validation**: Comprehensive parameter checking
- **Audit Status**: Internal review completed, external audit pending

### Frontend Security
- **Input Sanitization**: All user inputs validated and sanitized
- **Error Boundaries**: Graceful error handling at multiple levels
- **Privacy**: Random bet IDs prevent enumeration
- **HTTPS**: All traffic encrypted with automatic SSL

## 📈 Platform Details

### Fee Structure (When Enabled)
- **Creator Fee**: 1% of losing pool
- **Platform Fee**: 0.5% of losing pool
- **User Experience**: Fees only charged to losing side

## 🛣️ Roadmap

### Short Term (Next Month)
- [ ] SEO optimization with rich social previews
- [ ] Mobile UX improvements
- [ ] Performance monitoring setup
- [ ] Component refactoring completion

### Medium Term (3 Months)
- [ ] Multi-token support (other ERC20 tokens)
- [ ] Advanced analytics dashboard
- [ ] PWA features for mobile app experience
- [ ] Comprehensive testing suite

### Long Term (6+ Months)
- [ ] Oracle integration for automatic resolution
- [ ] Governance system for platform decisions
- [ ] Mobile native app (React Native)
- [ ] Mainnet deployment

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **React**: Hooks with proper dependencies, error boundaries
- **Testing**: Unit tests for utilities, integration tests for components
- **Documentation**: Clear comments for complex business logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **HyperLiquid**: For providing the testnet infrastructure
- **Foundry**: For the excellent smart contract development toolkit
- **Vercel**: For seamless deployment and hosting
- **Community**: For testing and feedback during development

---

**Built with ❤️ for the decentralized betting community**

*Bet responsibly and only what you can afford to lose.*