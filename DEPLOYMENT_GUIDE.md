# Deployment Guide - fhEVM Perpetual DEX

This guide walks you through deploying the privacy-preserving perpetual DEX to Sepolia testnet (with fhEVM coprocessor) and Vercel.

## Prerequisites

Before deploying, ensure you have:

- [x] Node.js 18+ installed
- [x] A wallet with Sepolia test ETH
- [x] Vercel account (for frontend deployment)
- [x] All dependencies installed (`npm install` in root directory)

## Part 1: Get Sepolia Test Tokens

### Step 1: Add Sepolia Testnet to MetaMask

Add the network with these details (most wallets have Sepolia pre-configured):

```
Network Name: Sepolia
RPC URL: https://rpc.sepolia.org
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

### Step 2: Get Test Tokens

You can get Sepolia test ETH from multiple faucets:

1. **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
2. **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
3. **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
4. **Google Cloud Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia

Simply connect your wallet or paste your address and request test ETH (usually 0.5 ETH per request).

### Step 3: Verify Balance

Check your balance:
```bash
# Get your wallet address from root directory
node -e "require('dotenv').config(); const ethers = require('ethers'); const pk = process.env.PRIVATE_KEY; const wallet = new ethers.Wallet(pk); console.log('Address:', wallet.address);"
```

Visit https://sepolia.etherscan.io to confirm you have test ETH.

## Part 2: Deploy Smart Contracts

### Step 1: Configure Environment

Create/Update `.env` in the **root directory**:

```env
# Sepolia Testnet Configuration (for fhEVM Coprocessor)
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
PRIVATE_KEY="0x_your_private_key"

# Etherscan API Key (optional, for contract verification)
ETHERSCAN_API_KEY="your_etherscan_api_key"

# Frontend Environment Variables
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"

# Contract Addresses (update after deployment)
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=""
NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS=""
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS=""
```

**Note**: Get a free Alchemy API key at https://www.alchemy.com/ or use a public RPC like https://rpc.sepolia.org

⚠️ **Security Warning**: Never commit your `.env` file. It's already in `.gitignore`.

### Step 2: Compile Contracts

```bash
cd packages/contracts
npx hardhat compile
```

Expected output:
```
Compiled 31 Solidity files successfully
```

### Step 3: Deploy to Sepolia Testnet

```bash
# From packages/contracts directory
npx hardhat run scripts/deploy.ts --network sepolia
```

Expected output:
```
Deploying contracts to Sepolia testnet with fhEVM coprocessor...

✅ PriceOracle deployed to: 0x...
✅ ACLManager deployed to: 0x...
✅ PositionManager deployed to: 0x...
✅ PerpetualDEX deployed to: 0x...

Deployment complete!
```

### Step 4: Update Environment Variables

Copy the deployed contract addresses and update `.env`:

```env
# Contract Addresses (from deployment output)
PRICE_ORACLE_ADDRESS=0x...
PERPETUAL_DEX_ADDRESS=0x...
POSITION_MANAGER_ADDRESS=0x...
ACL_MANAGER_ADDRESS=0x...

# Frontend Environment Variables
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS=0x...
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS=0x...
```

### Step 5: Verify Deployment

Check the contracts on Etherscan:
```
https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
```

You can also verify your contract source code on Etherscan:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 6: Initialize Price Feeds

Set initial prices for trading pairs:

```bash
npx hardhat run scripts/initialize-prices.ts --network sepolia
```

This will set prices for BTC/USD, ETH/USD, and other supported assets.

## Part 3: Update Frontend Configuration

### Step 1: Update Contract Configuration

The frontend should automatically pick up the `.env` variables. Verify in:

`packages/frontend/lib/config/contracts.ts`

The addresses should be loaded from environment variables.

### Step 2: Test Locally

```bash
cd packages/frontend
npm run dev
```

Visit http://localhost:3000 and:
1. Connect your wallet
2. Switch to Sepolia testnet
3. Try opening a position (with test amounts)
4. Verify the transaction goes through

## Part 4: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

```bash
cd packages/frontend
npx vercel
```

Follow the prompts:
- Setup and deploy: `Y`
- Which scope: Choose your account
- Link to existing project: `N`
- Project name: `fhevm-perp-dex`
- Directory: `./`
- Override settings: `N`

### Step 2: Set Environment Variables

In Vercel dashboard or CLI:

```bash
vercel env add NEXT_PUBLIC_CHAIN_ID
# Enter: 8009

vercel env add NEXT_PUBLIC_RPC_URL
# Enter: https://devnet.zama.ai

vercel env add NEXT_PUBLIC_PRICE_ORACLE_ADDRESS
# Enter: 0x... (from deployment)

vercel env add NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS
# Enter: 0x... (from deployment)

vercel env add NEXT_PUBLIC_POSITION_MANAGER_ADDRESS
# Enter: 0x... (from deployment)
```

### Step 3: Deploy to Production

```bash
vercel --prod
```

Your site will be live at: `https://fhevm-perp-dex.vercel.app`

## Part 5: Post-Deployment Testing

### Test Checklist

- [ ] **Wallet Connection**: Connect wallet and verify network is Sepolia testnet
- [ ] **Price Display**: Check if prices load from oracle (green indicator)
- [ ] **Open Position**: Try opening a small test position
  - Enter size: 100
  - Enter collateral: 1000
  - Click "Open Long Position"
  - Confirm transaction in wallet (requires test ETH for gas)
  - Wait for confirmation
- [ ] **View Positions**: Navigate to Positions page
  - See your open position
  - Verify encrypted size/collateral show 🔒 icon
  - Check PnL calculation
- [ ] **Close Position**: Try closing a position
  - Click "Close Position"
  - Confirm transaction
  - Verify position is closed

### Troubleshooting

**Issue: Prices show "Demo Data"**
- Solution: Verify `NEXT_PUBLIC_PRICE_ORACLE_ADDRESS` is set correctly
- Run price initialization script if not done

**Issue: Transaction fails with "Insufficient funds"**
- Solution: Get more test ETH from Sepolia faucets

**Issue: Contract not found**
- Solution: Verify contract addresses in `.env` match deployed addresses
- Check that you're connected to Sepolia testnet (Chain ID 11155111)

**Issue: MetaMask shows wrong network**
- Solution: Switch to Sepolia testnet manually in MetaMask

**Issue: Position not showing**
- Solution: Wait 10 seconds and refresh (polling interval)

**Issue: Transaction fails with "Gas estimation failed"**
- Solution: Ensure you have enough test ETH for gas fees
- Check that contracts are properly deployed and initialized

## Part 6: Maintenance

### Update Prices

Prices should be updated periodically by the contract owner:

```bash
cd packages/contracts
npx hardhat run scripts/update-price.ts --network sepolia
```

### Monitor Contracts

Check contract activity on Etherscan:
```
https://sepolia.etherscan.io/address/<PERPETUAL_DEX_ADDRESS>
```

### Update Frontend

To update the deployed frontend:

```bash
cd packages/frontend
git pull  # Get latest changes
vercel --prod  # Deploy to production
```

## Security Considerations

1. **Private Keys**: Never share your private key or commit `.env` files
2. **Test Network**: This is Sepolia testnet - don't use real mainnet funds
3. **Audit**: Smart contracts have NOT been audited - use at your own risk
4. **Encryption**: Position data is encrypted on-chain using fhEVM coprocessor but can be decrypted by the position owner
5. **fhEVM Coprocessor**: This uses Zama's fhEVM coprocessor on Sepolia for privacy-preserving computations

## Important Notes

- **Network**: We're using Sepolia testnet with Zama's fhEVM coprocessor, not a standalone Zama chain
- **Gas Costs**: Transactions require Sepolia test ETH for gas
- **Encryption**: All encrypted operations are handled by the fhEVM coprocessor deployed on Sepolia

## Support

For issues or questions:
- Review contract code in `packages/contracts/contracts/`
- Check Zama fhEVM documentation: https://docs.zama.ai/fhevm
- Zama Protocol docs: https://docs.zama.org/protocol
- Open an issue on GitHub

## Appendix: Deployment Scripts

### deploy.ts

Located at: `packages/contracts/scripts/deploy.ts`

Deploys contracts in order:
1. PriceOracle
2. ACLManager
3. PositionManager
4. PerpetualDEX

### initialize-prices.ts

Sets initial prices for supported assets.

### update-price.ts

Updates a single asset price (owner only).

---

**Deployment Status**:
- Smart Contracts: ⏳ Not yet deployed to Sepolia testnet
- Frontend: ⏳ Not yet deployed to Vercel

Once deployed, update this document with:
- Contract addresses on Sepolia
- Deployment date
- Vercel URL

**Network Information**:
- Network: Sepolia Testnet
- Chain ID: 11155111
- RPC URL: https://rpc.sepolia.org (or Alchemy/Infura)
- Block Explorer: https://sepolia.etherscan.io
- Faucets: Multiple available (see Part 1, Step 2)
