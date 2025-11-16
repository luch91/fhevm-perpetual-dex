# Testing Guide - New Position Management UI

## Prerequisites

1. **Wallet Setup**
   - Install MetaMask or compatible Web3 wallet
   - Switch to Sepolia Testnet (Chain ID: 11155111)
   - Get Sepolia ETH from faucet: https://sepoliafaucet.com/

2. **Frontend Running**
   - Navigate to: http://localhost:3000
   - Verify connection to Sepolia in your wallet

## Step-by-Step Testing

### 1. Test Position UI Access

**Action**: Visit the trading page
- URL: http://localhost:3000/trade
- You should see:
  - Real-time price display at top (BTC, ETH, SOL)
  - TradingView chart on left
  - Order form on right
  - **NEW**: Positions list at bottom

**Expected Result**:
- If not connected: "Connect your wallet to view positions" message
- If connected with no positions: "No positions found" message

### 2. Connect Wallet

**Action**: Click "Connect Wallet" button
- Select your wallet (MetaMask recommended)
- Approve connection
- Ensure you're on Sepolia testnet

**Expected Result**:
- Wallet address appears in header
- Positions section shows "Refresh" button
- Network badge shows "Sepolia"

### 3. Open a Test Position

**Action**: Use the Order Form
1. Select asset (BTC/USD recommended)
2. Choose side (Long or Short)
3. Set leverage (try 2x for testing)
4. Enter size (e.g., 1000)
5. Enter collateral (e.g., 500)
6. Click "Open Position"

**Expected Result**:
- Transaction popup in wallet
- After confirmation: Success message
- Transaction hash displayed
- Position appears in list below

### 4. View Position Details

**Action**: Check your new position in the Positions List

**Expected Information**:
- Position # badge
- LONG/SHORT indicator with leverage
- OPEN/CLOSED status
- Entry price
- Current price (live from CoinGecko)
- Liquidation price
- PnL percentage (both leveraged and unleveraged)
- Position age (when opened)

**Example**:
```
LONG 2x | OPEN
Position #0

+2.40%              (leveraged PnL)
+1.20% unleveraged  (actual price movement)

Entry Price:    $97,234
Current Price:  $98,402
Liquidation:    $92,372
Opened:         11/15/2025
```

### 5. Test Position Filtering

**Action**: Click filter tabs
- Click "All" - Shows all positions
- Click "Open" - Shows only open positions
- Click "Closed" - Shows only closed positions

**Expected Result**:
- Position count updates based on filter
- Correct positions displayed for each filter

### 6. Monitor PnL Changes

**Action**: Wait for price updates (every ~10 seconds from CoinGecko)

**Expected Result**:
- PnL percentage updates automatically
- Color changes (green for profit, red for loss)
- Leveraged PnL = unleveraged PnL × leverage

**Example Calculation**:
```
If BTC moves from $97,000 to $98,000:
- Price change: +1.03%
- With 5x leverage: +5.15% PnL
- With 10x leverage: +10.3% PnL
```

### 7. Test Liquidation Warnings

**Action**: Look for positions with red borders

**Expected Warnings**:
- Red border around position card
- Red "Near Liquidation" alert box
- Warning message with liquidation price

**This happens when**:
- Long position: Current price < Liquidation price × 1.1
- Short position: Current price > Liquidation price × 0.9

### 8. Close a Position

**Action**: Click "Close Position" button
1. Transaction popup appears
2. Confirm in wallet
3. Wait for confirmation

**Expected Result**:
- Position status changes to "CLOSED"
- Badge changes from green to gray
- Close button disappears
- Final PnL is locked in

### 9. Test Summary Statistics

**Action**: Scroll to bottom of Positions List

**Expected Data**:
- Total Positions: X
- Open Positions: Y (in green)
- Closed Positions: Z (in gray)

### 10. Test Refresh Functionality

**Action**: Click "Refresh" button

**Expected Result**:
- Button shows "Loading..." state
- Position data reloads from blockchain
- Prices update from CoinGecko
- New positions appear if any were opened elsewhere

## Troubleshooting

### Issue: "Connect your wallet" won't go away
**Solution**: 
- Check MetaMask is unlocked
- Verify you're on Sepolia (Chain ID: 11155111)
- Refresh page and reconnect

### Issue: No positions showing after opening one
**Solution**:
- Click "Refresh" button
- Check transaction was confirmed on Sepolia Etherscan
- Verify contract address in .env.local is correct

### Issue: PnL shows 0.00%
**Solution**:
- Wait for CoinGecko price update (~10 seconds)
- Click Refresh to fetch latest prices
- Check browser console for API errors

### Issue: "Position not accessible" error
**Solution**:
- You can only view positions you own
- Position might not exist yet
- Check position ID is correct

### Issue: Liquidation price seems wrong
**Solution**:
- This is calculated client-side
- Formula: Entry × (1 - maintenance_margin / leverage)
- For long positions, liquidation is below entry
- For short positions, liquidation is above entry

## Advanced Testing Scenarios

### Scenario 1: Multiple Positions
1. Open 3 different positions (different assets/sides)
2. Verify all show in list
3. Filter by Open/Closed
4. Close one position
5. Verify counts update

### Scenario 2: High Leverage
1. Open position with 10x leverage
2. Watch PnL change rapidly
3. Note how close liquidation price is
4. Should see near-liquidation warning quickly

### Scenario 3: Price Volatility
1. Open position during volatile period
2. Monitor PnL every few seconds
3. Observe color changes (green↔red)
4. Test closing at profit vs loss

## Performance Benchmarks

**Expected Load Times**:
- Page load: <3 seconds
- Wallet connection: <2 seconds
- Position fetch: <5 seconds
- Price update: ~10 seconds (CoinGecko rate limit)
- Transaction confirmation: 10-30 seconds (Sepolia)

## Known Limitations

1. **Encrypted Values**: Size and collateral show as encrypted (euint64)
   - This is expected with fhEVM
   - Requires decryption for display (not yet implemented)

2. **Position ID Discovery**: Currently tries positions 0-9
   - May miss positions with ID >9
   - Future: Use event logs for better discovery

3. **Price Feed**: Uses CoinGecko (centralized)
   - Chainlink integration ready but not deployed
   - Once deployed, prices will be decentralized

4. **No Position History**: Only shows current state
   - Historical PnL not tracked
   - Future: Add PnL over time chart

## Success Criteria

✅ All tests passed if:
- Positions display correctly after opening
- PnL calculates accurately
- Liquidation prices are reasonable
- Filtering works as expected
- Closing positions succeeds
- Summary stats are accurate

## Next Steps After Testing

1. Report any bugs or issues
2. Review documentation (CHAINLINK_INTEGRATION.md)
3. When ready, deploy Chainlink oracle
4. Test again with decentralized price feeds

## Quick Test Checklist

- [ ] Connect wallet to Sepolia
- [ ] Open a test position
- [ ] Verify position appears in list
- [ ] Check PnL calculation
- [ ] Test position filtering
- [ ] Monitor price updates
- [ ] Check liquidation warnings
- [ ] Close a position
- [ ] Verify summary statistics
- [ ] Test refresh functionality

Happy testing! 🚀
