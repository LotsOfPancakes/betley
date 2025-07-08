# Betley - Decentralized Betting Platform

A pari-mutuel style betting platform built on HyperEVM testnet using HYPE tokens.

## Features
- Create custom bets with 2-4 options
- Bet with HYPE tokens
- Automatic pari-mutuel payout distribution
- 72-hour resolution deadline with auto-refund
- Single option betting per user

## Tech Stack
- Smart Contracts: Solidity + Foundry
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Web3: Wagmi, Viem, ConnectKit
- Blockchain: HyperEVM Testnet

## Development Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and add your private key
4. Deploy contracts: `cd contracts && forge script script/Deploy.s.sol --rpc-url https://rpc.hyperliquid-testnet.xyz/evm --broadcast`
5. Update contract address in `frontend/lib/contractABI.ts`
6. Run frontend: `cd frontend && pnpm dev`

## Contract Addresses
- Betley Contract: [To be updated]
- HYPE Token: 0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C
