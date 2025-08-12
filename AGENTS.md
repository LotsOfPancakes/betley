# AGENTS.md - Betley Development Guide

## Build/Test Commands
- **Frontend**: `cd frontend && npm run dev` (development), `npm run build`, `npm run lint`
- **Contracts**: `cd contracts && forge build`, `forge test`, `forge test --match-test testName` (single test)
- **No test framework found in frontend** - check with user before assuming testing approach

## Code Style Guidelines

### Frontend (Next.js/TypeScript)
- Use TypeScript strict mode with proper typing
- Import order: React/Next.js, external libraries, internal components/utils
- Use `'use client'` directive for client components
- Functional components with hooks (useState, useAccount from wagmi)
- TailwindCSS for styling with utility classes
- File naming: PascalCase for components, camelCase for utilities
- Path aliases: `@/*` maps to project root

### Contracts (Solidity)
- Solidity ^0.8.20 with OpenZeppelin imports
- SPDX-License-Identifier: MIT
- Comprehensive NatSpec documentation with @title, @dev, @param, @return
- Clear section comments with `// ========== SECTION ==========`
- Events for all state changes
- ReentrancyGuard and access control patterns
- Explicit visibility modifiers (external/public/internal/private)

### General
- No comments unless explicitly requested
- Follow existing patterns and conventions in the codebase
- Use existing libraries (wagmi, viem, @tanstack/react-query, supabase)
- Avoid over-engineering. Question the need to have certain features/functionalities if there may be more direct ways to achieve a goal
- No adding of new functionality or UI elements unless requested for, or is necessary as part of the plan to achieve goals