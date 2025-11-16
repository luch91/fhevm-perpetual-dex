# Chainlink Price Oracle Integration Guide

## Overview

This guide covers the integration of Chainlink price feeds for real-time, decentralized price data in the fhEVM Perpetual DEX.

## Architecture

### Current Setup
- **Mock PriceOracle**: Currently deployed at `0xC201C14DFA83F659B32e4d625209c54cb9B7D120`
- **ChainlinkPriceOracle**: Ready for deployment with BTC/USD and ETH/USD feeds

### Migration Plan
1. Deploy ChainlinkPriceOracle
2. Update PositionManager to use Chainlink feeds
3. Redeploy PositionManager
4. Setup automated price monitoring

## Deployment Instructions

### 1. Deploy ChainlinkPriceOracle

```bash
cd packages/contracts
npx hardhat run scripts/deploy-chainlink-oracle.ts --network sepolia
```

This will:
- Deploy ChainlinkPriceOracle with BTC/USD and ETH/USD feeds
- Verify feeds are working
- Output contract address

### 2. Update Environment Variables

Add to `packages/frontend/.env.local`:
```bash
NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS=<deployed_address>
```

### 3. Update PositionManager

The PositionManager needs to be redeployed to point to the ChainlinkPriceOracle:

```bash
# Edit scripts/deploy.ts to use ChainlinkPriceOracle address
npx hardhat run scripts/deploy.ts --network sepolia
```

## Available Price Feeds on Sepolia

| Asset | Address | Description |
|-------|---------|-------------|
| BTC/USD | 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43 | Bitcoin / USD |
| ETH/USD | 0x694AA1769357215DE4FAC081bf1f309aDC325306 | Ethereum / USD |
| LINK/USD | 0xc59E3633BAAC79493d908e63626716e204A45EdF | Chainlink / USD |
| USDC/USD | 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E | USDC / USD |

Note: SOL/USD is NOT available on Sepolia testnet.

## Price Monitoring

### Manual Price Check

```bash
cd packages/contracts
npx hardhat run scripts/monitor-prices.ts --network sepolia
```

### Automated Monitoring (Production)

For production, set up a cron job or use a service like:
- **Chainlink Keepers**: Automated execution
- **Gelato Network**: Web3 automation
- **Custom Node.js Service**: Self-hosted monitoring

Example cron (every 5 minutes):
```bash
*/5 * * * * cd /path/to/project/packages/contracts && npx hardhat run scripts/monitor-prices.ts --network sepolia >> logs/price-monitor.log 2>&1
```

## Price Update Scripts

### For Mock Oracle (Development)

```bash
# Update mock prices from CoinGecko
cd packages/contracts
npx hardhat run scripts/update-price.ts --network sepolia
```

### For Chainlink Oracle (Production)

Chainlink feeds update automatically - no manual updates needed!
This is the key advantage of using Chainlink.

## Integration Benefits

### Why Chainlink vs Mock Oracle

| Feature | Mock Oracle | Chainlink Oracle |
|---------|-------------|------------------|
| **Price Updates** | Manual via script | Automatic |
| **Decentralization** | Centralized (owner) | Decentralized network |
| **Freshness** | Depends on script | Real-time (<1 hour) |
| **Security** | Single point of failure | Multiple oracle nodes |
| **Cost** | Gas for updates | Gas for reads only |
| **Maintenance** | Requires monitoring | Self-maintaining |

## Testing

### 1. Verify Chainlink Feeds

```typescript
const oracle = await ethers.getContractAt("ChainlinkPriceOracle", address);

// Get BTC price
const [price, decimals, timestamp] = await oracle.getPrice("BTC/USD");
console.log("BTC Price:", ethers.formatUnits(price, decimals));

// Check freshness
const isFresh = await oracle.isPriceFresh("BTC/USD");
console.log("Is Fresh:", isFresh);
```

### 2. Test Position Opening with Chainlink Prices

1. Connect wallet to Sepolia
2. Go to http://localhost:3000/trade
3. Open a position
4. Verify entry price matches Chainlink feed

## Troubleshooting

### "Price is stale" Error

**Cause**: Chainlink feed hasn't been updated in >1 hour
**Solution**: 
- Check Chainlink network status
- Verify feed is active on Sepolia
- Consider increasing `STALENESS_THRESHOLD`

### "Price feed not found" Error

**Cause**: Asset not configured in ChainlinkPriceOracle
**Solution**:
```bash
# Add new feed
npx hardhat run scripts/add-price-feed.ts --network sepolia
```

### Network Connectivity Issues

**Cause**: RPC endpoint timeout
**Solution**:
- Use alternative RPC (Infura, Alchemy, PublicNode)
- Check rate limits
- Verify network is Sepolia (chainId: 11155111)

## Security Considerations

1. **Price Manipulation**: Chainlink uses multiple oracle nodes - resistant to manipulation
2. **Staleness**: Always check `isPriceFresh()` before using price
3. **Access Control**: Only owner can add/update feeds
4. **Fallback**: Consider implementing fallback oracle for redundancy

## Next Steps

1. ✅ ChainlinkPriceOracle contract implemented
2. ⏳ Deploy to Sepolia testnet
3. ⏳ Update PositionManager to use Chainlink
4. ⏳ Test end-to-end with real positions
5. ⏳ Set up monitoring dashboard
6. ⏳ Add additional assets (LINK, USDC)

## Resources

- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1)
- [Sepolia Testnet Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&categories=verified)
- [Chainlink Documentation](https://docs.chain.link/)
