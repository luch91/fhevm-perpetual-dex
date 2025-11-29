# fhEVM Perpetual DEX

A **privacy-preserving perpetual futures decentralized exchange** built with fhEVM (Fully Homomorphic Encryption Virtual Machine).

## 🔐 Privacy Features

- **Encrypted Positions**: Position sizes and collateral encrypted on-chain using FHE
- **Private Trading**: Only you can decrypt your position details
- **Leveraged Trading**: Trade with up to 10x leverage
- **Privacy-Preserving Liquidations**: Liquidations work without revealing private data
- **User-Controlled Decryption**: Generate keypairs and decrypt when needed

## 🚀 Key Features

### Trading
- Long/Short positions on BTC/USD, ETH/USD, SOL/USD
- 1x to 10x leverage
- Real-time Chainlink price feeds
- Funding rates (8-hour intervals)
- Automatic liquidations (5% maintenance margin)

### Privacy (FHE Integration)
- Position sizes encrypted as `euint64`
- Collateral amounts encrypted as `euint64`
- Automatic keypair generation
- Gateway-based decryption
- Privacy UI indicators

### User Experience
- Real-time PnL tracking
- Transaction history with CSV export
- Analytics dashboard (win rate, total PnL, charts)
- Mobile-responsive design
- Toast notifications

## 📁 Project Structure

```
fhevm-perpetual-dex/
├── packages/
│   ├── contracts/              # Smart Contracts
│   │   ├── contracts/
│   │   │   ├── core/          # PositionManager, SimplePositionManager
│   │   │   ├── interfaces/    # Contract interfaces
│   │   │   ├── oracles/       # ChainlinkPriceOracle
│   │   │   └── mocks/         # MockUSDC for testing
│   │   ├── scripts/           # Deployment & utility scripts
│   │   ├── test/              # Contract tests
│   │   └── hardhat.config.ts
│   │
│   └── frontend/              # Next.js Frontend
│       ├── app/               # Pages (trade, positions, history, analytics)
│       ├── components/
│       │   ├── trading/       # OrderForm, Charts, Prices
│       │   ├── positions/     # PositionsList, PositionCard
│       │   ├── history/       # TransactionHistory
│       │   ├── analytics/     # AnalyticsDashboard
│       │   ├── privacy/       # PrivacyIndicator (FHE UI)
│       │   └── layout/        # Header, Footer
│       ├── lib/
│       │   ├── hooks/         # useFhevm, useEncryptedPositions
│       │   ├── fhevm/         # Keypair management
│       │   ├── contracts/     # ABIs, addresses
│       │   └── config/        # Configuration
│       └── next.config.js
│
└── README.md
```

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.24
- **fhEVM** v0.8 (Fully Homomorphic Encryption)
- **Hardhat** - Development framework
- **Chainlink** - Price oracles

### Frontend
- **Next.js** 14 (React)
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **fhevmjs** v0.3.2 - FHE encryption library
- **Wagmi** v2 - Web3 integration
- **RainbowKit** - Wallet connection
- **ethers.js** v6 - Contract interaction

### Infrastructure
- **Sepolia Testnet** - Current deployment
- **Zama Gateway** - FHE decryption service
- **Vercel** - Frontend hosting (ready)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Clone repository
git clone <repo-url>
cd fhevm-perpetual-dex

# Install dependencies
npm install

# Install contract dependencies
cd packages/contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup

1. Copy `.env.example` to `.env` in root directory
2. Fill in required variables:

```bash
# RPC & Network
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"

# Contract Addresses (update after deployment)
NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS="0x..."
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="0x..."
NEXT_PUBLIC_USDC_ADDRESS="0x..."

# fhEVM Gateway (for privacy features)
NEXT_PUBLIC_GATEWAY_URL="https://gateway.sepolia.zama.ai"
```

## 📦 Deployment

### Deploy Contracts (Sepolia)

```bash
cd packages/contracts

# Deploy complete system (recommended)
npx hardhat run scripts/deploy-complete-system.ts --network sepolia

# OR deploy FHE-enabled PositionManager (for privacy)
npx hardhat run scripts/deploy-fhe-position-manager.ts --network sepolia
```

### Deploy Frontend (Vercel)

```bash
cd packages/frontend

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

## 🔧 Development

### Compile Contracts

```bash
cd packages/contracts
npm run compile
```

### Run Contract Tests

```bash
cd packages/contracts
npm test
```

### Run Frontend Dev Server

```bash
cd packages/frontend
npm run dev
# Open http://localhost:3000
```

## 📊 Deployed Contracts (Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ChainlinkPriceOracle** | `0x45328039a3F8a5502e34Ee9038b1649e33eF4600` | BTC/ETH/SOL prices |
| **SimplePositionManager** | `0xa331c2Fccbaa812a84AC4941a44CC071C1af8f3e` | Non-encrypted positions |
| **FundingRateManager** | `0x4848336ED7603b79e45325B03e12C6a938F8626E` | Funding rate calculations |
| **LiquidationKeeper** | `0x82a2342907FfeB8cf7Dd43f7903211CA8CC90f5F` | Automated liquidations |
| **MockUSDC** | `0xD443Fe9E97732EBE6Cc5A6D638D5cda3A1F489DF` | Test USDC token |

**Note**: To activate privacy features, deploy `PositionManager` (FHE-enabled) using the deployment script.

## 🔐 Privacy Implementation

### Activate FHE Privacy Features

1. **Deploy FHE PositionManager**:
```bash
cd packages/contracts
npx hardhat run scripts/deploy-fhe-position-manager.ts --network sepolia
```

2. **Update Environment**:
```bash
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="<new_fhe_address>"
```

3. **User Flow**:
   - Connect wallet → Keypair auto-generates
   - Open position → Encrypted on-chain
   - View positions → Shows encrypted badges
   - Click decrypt → Request from gateway
   - View actual values → Unlocked

### Migration from SimplePosition to FHE

```bash
# Set addresses
export OLD_POSITION_MANAGER_ADDRESS="0xa331..." # SimplePositionManager
export NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="0x..." # New FHE PositionManager

# Run migration
npx hardhat run scripts/migrate-to-fhe.ts --network sepolia
```

## 📱 Using the Application

### 1. Get Test USDC
- Connect wallet on Sepolia
- Click "Get Test USDC" button
- Mint tokens for trading

### 2. Open a Position
- Navigate to Trade page
- Select asset (BTC/ETH/SOL)
- Choose Long or Short
- Set leverage (1-10x)
- Enter size and collateral
- Approve USDC → Open Position

### 3. Monitor Positions
- View real-time PnL on Positions page
- See live price updates
- Check liquidation price warnings
- Close positions when ready

### 4. View Analytics
- Transaction history with filters
- Performance metrics (win rate, total PnL)
- Charts (win/loss distribution)
- CSV export for tax reporting

## 🧪 Testing

### Contract Tests

```bash
cd packages/contracts
npm test
# 25 comprehensive tests covering:
# - Position opening/closing
# - USDC transfers
# - PnL calculations
# - Liquidation system
```

### Frontend Tests

```bash
cd packages/frontend
npm test
```

## 📚 Key Concepts

### Perpetual Futures
- No expiry date (unlike traditional futures)
- Funding rates keep price aligned with spot
- Long positions: Profit when price increases
- Short positions: Profit when price decreases

### Funding Rates
- Applied every 8 hours
- Balances long/short positions
- Max rate: ±0.1% per interval
- Longs pay when positive, receive when negative

### Liquidation
- Triggered when collateral ratio < 5%
- Liquidator receives 5% reward
- Protects protocol from bad debt
- Automatic via keeper bot

### FHE Privacy
- Position size encrypted as `euint64`
- Collateral encrypted as `euint64`
- Only owner can decrypt
- Liquidations still work (use public entry price)

## 🔒 Security Considerations

### Smart Contracts
- Maintenance margin: 5%
- Initial margin: 10%
- Max leverage: 10x
- USDC as collateral (battle-tested ERC20)

### Privacy
- Keypair stored in localStorage
- Gateway-based decryption (Zama)
- ACL (Access Control List) on-chain
- Only position owner can decrypt

### Recommendations
- Audit contracts before mainnet
- Implement password-protected keypairs
- Add cloud backup for keypairs
- Monitor liquidation keeper uptime

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] Position management (long/short)
- [x] Chainlink price feeds
- [x] Funding rates
- [x] Liquidation system
- [x] USDC integration

### Phase 2: UX Improvements ✅
- [x] Real-time PnL tracking
- [x] Transaction history
- [x] Analytics dashboard
- [x] Mobile responsiveness

### Phase 3: Privacy Features ✅
- [x] FHE encryption integration
- [x] User keypair management
- [x] Privacy UI components
- [x] Migration tools

### Phase 4: Advanced Features (Planned)
- [ ] User onboarding flow
- [ ] Tooltips & help system
- [ ] FAQ page
- [ ] More trading pairs (AVAX, LINK, UNI)
- [ ] Stop-loss / Take-profit orders
- [ ] Limit orders
- [ ] Partial liquidations

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review contract tests for examples

---

**Built with ❤️ using fhEVM for privacy-preserving DeFi**

*Bringing true privacy to perpetual futures trading*
