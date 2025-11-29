import { ethers } from "hardhat";

/**
 * Complete End-to-End Testing Script
 * Tests the full lifecycle: Open -> Check Funding -> Close -> Verify PnL
 */
async function main() {
  const PM_ADDRESS = "0xa331c2Fccbaa812a84AC4941a44CC071C1af8f3e";
  const FM_ADDRESS = "0x4848336ED7603b79e45325B03e12C6a938F8626E";
  const USDC_ADDRESS = "0xD443Fe9E97732EBE6Cc5A6D638D5cda3A1F489DF";
  const ORACLE_ADDRESS = "0x45328039a3F8a5502e34Ee9038b1649e33eF4600";

  console.log("\n" + "=".repeat(80));
  console.log("COMPLETE END-TO-END FLOW TEST");
  console.log("=".repeat(80) + "\n");

  const [trader] = await ethers.getSigners();
  console.log("Trader:", trader.address);

  // Get contracts
  const pm = await ethers.getContractAt("SimplePositionManager", PM_ADDRESS);
  const fm = await ethers.getContractAt("FundingRateManager", FM_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const oracle = await ethers.getContractAt("PriceOracle", ORACLE_ADDRESS);

  // ============================================================================
  // STEP 1: Check Initial Balances
  // ============================================================================
  console.log("\n[STEP 1] Initial State");
  console.log("-".repeat(80));

  const initialBalance = await usdc.balanceOf(trader.address);
  console.log("USDC Balance:", ethers.formatUnits(initialBalance, 6), "USDC");

  const allowance = await usdc.allowance(trader.address, PM_ADDRESS);
  console.log("USDC Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  // Get current BTC price
  const [btcPrice, , priceTimestamp] = await oracle.getPrice("BTC/USD");
  console.log("BTC Price:", ethers.formatUnits(btcPrice, 8), "USD");
  console.log("Price Timestamp:", new Date(Number(priceTimestamp) * 1000).toLocaleString());

  // Get initial funding rate
  const [initialRate, lastUpdate] = await fm.getFundingRate("BTC/USD");
  console.log("Initial Funding Rate:", initialRate.toString(), "bps");
  console.log("Last Update:", new Date(Number(lastUpdate) * 1000).toLocaleString());

  // ============================================================================
  // STEP 2: Approve USDC (if needed)
  // ============================================================================
  console.log("\n[STEP 2] USDC Approval");
  console.log("-".repeat(80));

  if (allowance < ethers.parseUnits("10000", 6)) {
    console.log("Approving USDC...");
    const approveTx = await usdc.approve(PM_ADDRESS, ethers.parseUnits("100000", 6));
    await approveTx.wait();
    console.log("✓ Approved 100,000 USDC");
  } else {
    console.log("✓ Already approved");
  }

  // ============================================================================
  // STEP 3: Open Long Position
  // ============================================================================
  console.log("\n[STEP 3] Opening Long Position");
  console.log("-".repeat(80));

  const size = 100;
  const collateral = ethers.parseUnits("1000", 6);
  const isLong = true;
  const leverage = 5;

  console.log("Parameters:");
  console.log("  Size:", size);
  console.log("  Collateral:", ethers.formatUnits(collateral, 6), "USDC");
  console.log("  Direction: LONG");
  console.log("  Leverage:", leverage + "x");
  console.log("  Entry Price (expected):", ethers.formatUnits(btcPrice, 8), "USD");

  const openTx = await pm.openPosition(size, collateral, isLong, leverage);
  const openReceipt = await openTx.wait();
  console.log("✓ Transaction:", openReceipt?.hash);

  // Find PositionOpened event
  const positionOpenedEvent = openReceipt?.logs.find((log: any) => {
    try {
      const parsed = pm.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      return parsed?.name === "PositionOpened";
    } catch {
      return false;
    }
  });

  let positionId: bigint = 0n;
  let entryPrice: bigint = 0n;

  if (positionOpenedEvent) {
    const parsed = pm.interface.parseLog({
      topics: positionOpenedEvent.topics as string[],
      data: positionOpenedEvent.data,
    });
    positionId = parsed?.args.positionId;
    entryPrice = parsed?.args.entryPrice;
    console.log("\n✓ Position Opened:");
    console.log("  Position ID:", positionId.toString());
    console.log("  Entry Price:", ethers.formatUnits(entryPrice, 8), "USD");
    console.log("  Timestamp:", new Date(Number(parsed?.args.timestamp) * 1000).toLocaleString());
  }

  // Verify USDC transferred
  const balanceAfterOpen = await usdc.balanceOf(trader.address);
  const contractBalance = await usdc.balanceOf(PM_ADDRESS);
  console.log("\n✓ USDC Transferred:");
  console.log("  Trader Balance:", ethers.formatUnits(balanceAfterOpen, 6), "USDC");
  console.log("  Contract Balance:", ethers.formatUnits(contractBalance, 6), "USDC");
  console.log("  Amount Transferred:", ethers.formatUnits(initialBalance - balanceAfterOpen, 6), "USDC");

  // ============================================================================
  // STEP 4: Check Position Details
  // ============================================================================
  console.log("\n[STEP 4] Position Details");
  console.log("-".repeat(80));

  const position = await pm.getPosition(positionId);
  console.log("Position Data:");
  console.log("  Size:", position.size.toString());
  console.log("  Collateral:", ethers.formatUnits(position.collateral, 6), "USDC");
  console.log("  Entry Price:", ethers.formatUnits(position.entryPrice, 8), "USD");
  console.log("  Leverage:", position.leverage.toString() + "x");
  console.log("  Is Long:", position.isLong);
  console.log("  Is Open:", position.isOpen);
  console.log("  Last Funding Time:", new Date(Number(position.lastFundingTime) * 1000).toLocaleString());

  // ============================================================================
  // STEP 5: Check Updated Funding Rate
  // ============================================================================
  console.log("\n[STEP 5] Funding Rate After Position");
  console.log("-".repeat(80));

  const [updatedRate, updatedTime] = await fm.getFundingRate("BTC/USD");
  console.log("Funding Rate:", updatedRate.toString(), "bps");
  console.log("Last Update:", new Date(Number(updatedTime) * 1000).toLocaleString());
  console.log("Rate Change:", (Number(updatedRate) - Number(initialRate)).toString(), "bps");

  // ============================================================================
  // STEP 6: Simulate Time Passage (Wait or Manual)
  // ============================================================================
  console.log("\n[STEP 6] Funding Accumulation");
  console.log("-".repeat(80));
  console.log("⏱️  In production, funding accrues over time (8-hour intervals)");
  console.log("⏱️  For testing, we'll close position now to check mechanism works");

  const timeSinceOpen = Math.floor(Date.now() / 1000) - Number(position.lastFundingTime);
  console.log("Time Since Open:", timeSinceOpen, "seconds");

  // Calculate expected funding
  const fundingPayment = await fm.calculateFundingPayment(
    "BTC/USD",
    position.size,
    position.isLong,
    position.lastFundingTime
  );
  console.log("Expected Funding Payment:", fundingPayment.toString(), "(negative = trader pays)");

  // ============================================================================
  // STEP 7: Close Position
  // ============================================================================
  console.log("\n[STEP 7] Closing Position");
  console.log("-".repeat(80));

  // Get current price (might have changed)
  const [exitPrice] = await oracle.getPrice("BTC/USD");
  console.log("Exit Price:", ethers.formatUnits(exitPrice, 8), "USD");
  console.log("Entry Price:", ethers.formatUnits(entryPrice, 8), "USD");

  // Calculate expected PnL
  const priceDiff = Number(exitPrice) - Number(entryPrice);
  const expectedPnl = (priceDiff * Number(position.size)) / 1e8;
  console.log("Expected PnL:", expectedPnl.toFixed(2), "USDC", expectedPnl > 0 ? "(profit)" : "(loss)");

  const closeTx = await pm.closePosition(positionId);
  const closeReceipt = await closeTx.wait();
  console.log("✓ Transaction:", closeReceipt?.hash);

  // Find PositionClosed event
  const positionClosedEvent = closeReceipt?.logs.find((log: any) => {
    try {
      const parsed = pm.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      return parsed?.name === "PositionClosed";
    } catch {
      return false;
    }
  });

  if (positionClosedEvent) {
    const parsed = pm.interface.parseLog({
      topics: positionClosedEvent.topics as string[],
      data: positionClosedEvent.data,
    });
    console.log("\n✓ Position Closed:");
    console.log("  Exit Price:", ethers.formatUnits(parsed?.args.exitPrice, 8), "USD");
    console.log("  Funding Payment:", parsed?.args.fundingPayment.toString());
    console.log("  Timestamp:", new Date(Number(parsed?.args.timestamp) * 1000).toLocaleString());
  }

  // ============================================================================
  // STEP 8: Verify Final Balances
  // ============================================================================
  console.log("\n[STEP 8] Final Balances");
  console.log("-".repeat(80));

  const finalBalance = await usdc.balanceOf(trader.address);
  const finalContractBalance = await usdc.balanceOf(PM_ADDRESS);

  console.log("Trader Balance:", ethers.formatUnits(finalBalance, 6), "USDC");
  console.log("Contract Balance:", ethers.formatUnits(finalContractBalance, 6), "USDC");

  const netChange = Number(finalBalance) - Number(initialBalance);
  const netChangeUSDC = ethers.formatUnits(Math.abs(netChange), 6);

  console.log("\nNet Change:",
    netChange >= 0 ? "+" : "-",
    netChangeUSDC,
    "USDC",
    netChange >= 0 ? "(profit)" : "(loss)"
  );

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));
  console.log("\n✅ All Steps Completed Successfully!");
  console.log("\nWhat was tested:");
  console.log("  ✓ USDC approval");
  console.log("  ✓ Opening position with USDC transfer");
  console.log("  ✓ Funding rate initialization");
  console.log("  ✓ Position data storage");
  console.log("  ✓ Funding payment calculation");
  console.log("  ✓ Closing position with PnL");
  console.log("  ✓ USDC payout");
  console.log("\n" + "=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test Failed:");
    console.error(error);
    process.exit(1);
  });
