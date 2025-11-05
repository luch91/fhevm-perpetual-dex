# fhEVM Perpetual DEX

A privacy-preserving perpetual futures decentralized exchange built with fhEVM (Fully Homomorphic Encryption Virtual Machine).

## Features

- **Private Trading**: Position sizes and liquidation prices remain encrypted
- **Leveraged Trading**: Trade with up to 10x leverage
- **PvP Model**: Pure peer-to-peer perpetual futures
- **Encrypted Liquidations**: Liquidation prices hidden from public view

## Project Structure

```
fhevm-perpetual-dex/
├── packages/
│   ├── contracts/     # Smart contracts (Hardhat + fhEVM)
│   └── frontend/      # Next.js application
├── package.json       # Monorepo configuration
└── README.md
```

## Tech Stack

- **Smart Contracts**: Solidity + fhEVM
- **Framework**: Hardhat
- **Frontend**: Next.js 14 + TailwindCSS
- **Blockchain**: Zama Devnet
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

```bash
# Compile contracts
npm run contracts:compile

# Run tests
npm run contracts:test

# Start frontend development server
npm run dev
```

### Deployment

```bash
# Deploy contracts to Zama Devnet
npm run contracts:deploy

# Build frontend for production
npm run frontend:build
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your private key and RPC URLs
3. Update contract addresses after deployment

## Documentation

- [Smart Contracts](./packages/contracts/README.md)
- [Frontend](./packages/frontend/README.md)

## License

MIT
