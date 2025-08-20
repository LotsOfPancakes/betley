# Betley - Decentralized Betting Platform

**🎯 Live at: [https://www.betley.xyz](https://www.betley.xyz)**

A betting platform built on Base Sepolia testnet using native ETH.

## 🌟 Features
- **Custom Bets**: Create bets with 2 custom options and flexible duration
- **Native ETH Betting**: Bet with native ETH on Base Sepolia
- **Pari-Mutuel Payouts**: Automatic fair distribution based on betting pools
- **Privacy-First**: Random bet IDs prevent enumeration and protect user privacy
- **Resolve or Refund**: 24-hour resolution deadline with automatic refund system
- **Stranded Fund Protection**: Frontend and contract validation prevents fund locks
- **Mobile Optimized**: Responsive design with PWA capabilities
- **Fee System**: 1% creator and 0.2% platform fees

## 🚀 Live Platform
- **Production**: [https://www.betley.xyz](https://www.betley.xyz)
- **Chain**: Base Sepolia Testnet
- **Contract**: `0xE4cBF75D535F62B84B6D6680dd25AE5A18a903F9`

## 🛠️ Tech Stack
- **Smart Contracts**: Solidity + Foundry
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Web3**: Wagmi v2, Viem, ConnectKit
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: Base Sepolia Testnet
- **Deployment**: Vercel with custom domain

## 🏗️ Architecture Overview

### Frontend Architecture
- **App Router**: Next.js 15 with TypeScript
- **State Management**: React Query + React hooks
- **Styling**: Tailwind CSS with custom design system
- **Web3 Integration**: Wagmi v2 with ConnectKit
- **Error Handling**: Multiple-level error boundaries

### Smart Contract Architecture
- **Pari-Mutuel Logic**: Fair payout calculation based on pool sizes
- **Fee System**: Optional creator (1%) and platform (0.2%) fees
- **Security**: ReentrancyGuard, access controls, comprehensive validation
- **Token Support**: Native ETH on Base Sepolia

### Database Schema
- **Bet Mappings**: Random ID ↔ Numeric ID for privacy
- **Caching Strategy**: React Query with optimized cache times
- **Privacy**: No sensitive bet data stored, only ID mappings

## 🔐 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Controls**: Owner-only functions for fee management
- **Input Validation**: Comprehensive parameter checking
- **Stranded Fund Protection**: Prevents resolution to options with no bets
- **Audit Status**: Internal review completed, external audit pending

### Frontend Security
- **Input Sanitization**: All user inputs validated and sanitized
- **Error Boundaries**: Graceful error handling at multiple levels
- **Privacy**: Random bet IDs prevent enumeration
- **HTTPS**: All traffic encrypted with automatic SSL

## 📈 Platform Details

### Fee Structure (When Enabled)
- **Creator Fee**: 1% of losing pool
- **Platform Fee**: 0.2% of losing pool
- **User Experience**: Fees only charged to losing side

### Recent Improvements (Latest Update)
- **Frontend Lock**: Resolution UI prevents selecting options with 0 bets
- **Contract Validation**: Smart contract rejects invalid resolutions
- **24-Hour Resolution**: Reduced from 48 hours for faster bet lifecycle
- **Enhanced Error Handling**: Clear feedback for invalid resolution attempts
- **Defense in Depth**: Multiple layers of protection prevent fund locks

## 🛣️ Roadmap

### Short Term (Next Month)
- [ ] SEO optimization with rich social previews
- [ ] Mobile UX improvements
- [ ] Performance monitoring setup

### Medium Term (3 Months)
- [ ] TG Support
- [ ] Advanced analytics dashboard
- [ ] Comprehensive testing suite

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **React**: Hooks with proper dependencies, error boundaries
- **Testing**: Unit tests for utilities, integration tests for components
- **Documentation**: Clear comments for complex business logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Base**: For providing the testnet infrastructure and L2 scaling
- **Foundry**: For the excellent smart contract development toolkit
- **Vercel**: For seamless deployment and hosting
- **Community**: For testing and feedback during development

---

**Built with ❤️ for the decentralized betting community**

*Bet responsibly and only what you can afford to lose.*
