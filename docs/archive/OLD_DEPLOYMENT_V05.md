# Old Deployment Info (fhEVM v0.5)

**Date:** November 6, 2025
**Protocol Version:** fhEVM v0.5
**Network:** Sepolia Testnet (Chain ID: 11155111)
**Status:** DEPRECATED - Migrated to v0.9

## Deployed Contract Addresses (v0.5)

- **PriceOracle:** `0xd873836f1DC9A077E46Ab67A589A6FC2575c9A10`
- **PositionManager:** `0xF4057BE0c6F2304e90b5c6D1bee9D55ccfD40f1c`
- **PerpetualDEX:** `0xBa2ac53D679A3848200dd213Fa920FCC3eDCe3b9`
- **Deployer Account:** `0x4B97Df84d0EC7B8d363cE13992D63a50939Ce86D`

## Libraries Used (v0.5)

**Smart Contracts:**
- `fhevm@0.5.0` (deprecated)
- `fhevm-contracts@0.1.0`
- Imports: `fhevm/lib/TFHE.sol`, `fhevm/gateway/GatewayCaller.sol`

**Frontend:**
- `fhevmjs@0.5.8` (deprecated)

## Architecture (v0.5)

- Direct blockchain interaction
- `TFHE` library for encrypted operations
- `GatewayCaller` abstract contract for decryption
- Simple RPC-based connection

## Migration Note

These contracts were replaced with fhEVM v0.9 contracts on [DATE_TO_BE_FILLED].
The old contracts remain on-chain but are no longer maintained or used by the frontend.

**Migration Branch:** `feature/fhevm-v09-upgrade`
**Migration Date:** November 12, 2025
