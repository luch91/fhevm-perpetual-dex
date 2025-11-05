# Smart Contracts

Privacy-preserving smart contracts for the fhEVM Perpetual DEX.

## Architecture

### Core Contracts

- **PerpetualDEX.sol**: Main protocol entry point and coordinator
- **PositionManager.sol**: Handles encrypted position management
- **ACLManager.sol**: Manages access control for encrypted data

### Key Features

- Encrypted position sizes using fhEVM's `euint64`
- Encrypted collateral amounts
- Privacy-preserving position management
- Access control for encrypted data

## Development

### Install Dependencies

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy

Deploy to Zama Devnet:

```bash
npm run deploy
```

Deploy to local network:

```bash
npm run deploy:local
```

## Contract Interactions

### Opening a Position

```solidity
// Encrypt position size and collateral on client-side using fhevmjs
// Then call:
positionManager.openPosition(
    encryptedSize,
    sizeProof,
    encryptedCollateral,
    collateralProof,
    isLong
);
```

### Closing a Position

```solidity
positionManager.closePosition(positionId);
```

### Viewing Positions

```solidity
// Get position details (encrypted fields require decryption)
Position memory position = positionManager.getPosition(positionId);

// Get user's position count
uint256 count = positionManager.getPositionCount(userAddress);
```

## Security

- All sensitive position data is encrypted using fhEVM
- Access control managed through ACLManager
- Only position owners can decrypt their own positions

## Testing

Tests coming in Phase 2!

## License

MIT
