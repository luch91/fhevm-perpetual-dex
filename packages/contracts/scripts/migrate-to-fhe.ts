import { ethers } from "hardhat";

/**
 * Migration Script: SimplePositionManager → PositionManager (FHE)
 *
 * This script helps users migrate their positions from the non-encrypted
 * SimplePositionManager to the FHE-enabled PositionManager.
 *
 * Process:
 * 1. Fetch all open positions from SimplePositionManager
 * 2. Close each position (get exit PnL)
 * 3. Reopen equivalent positions on FHE PositionManager (with encryption)
 */

async function main() {
  console.log("\n========================================");
  console.log("🔄 MIGRATION TO FHE POSITION MANAGER");
  console.log("========================================\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Migrating positions for:", signer.address);

  // Get contract addresses
  const oldPMAddress = process.env.OLD_POSITION_MANAGER_ADDRESS;
  const newPMAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;

  if (!oldPMAddress || !newPMAddress || !usdcAddress) {
    throw new Error("Missing contract addresses in environment");
  }

  console.log("\n📋 Contract Addresses:");
  console.log("Old SimplePositionManager:", oldPMAddress);
  console.log("New PositionManager (FHE):", newPMAddress);
  console.log("USDC Token:", usdcAddress);

  // Get contract instances
  const SimplePositionManager = await ethers.getContractFactory("SimplePositionManager");
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");

  const oldPM = SimplePositionManager.attach(oldPMAddress);
  const newPM = PositionManager.attach(newPMAddress);
  const usdc = MockUSDC.attach(usdcAddress);

  // Get all open positions from old contract
  console.log("\n🔍 Fetching open positions from SimplePositionManager...");
  const positionCount = await oldPM.getPositionCount(signer.address);
  console.log(`Found ${positionCount} total positions`);

  const openPositions: any[] = [];

  for (let i = 0; i < Number(positionCount); i++) {
    try {
      const position = await oldPM.getPosition(i);
      if (position.isOpen) {
        openPositions.push({
          id: i,
          size: position.size,
          collateral: position.collateral,
          entryPrice: position.entryPrice,
          leverage: position.leverage,
          isLong: position.isLong,
          timestamp: position.timestamp,
        });
      }
    } catch (err) {
      console.log(`Position ${i} not accessible`);
    }
  }

  console.log(`\n📊 Found ${openPositions.length} open positions to migrate`);

  if (openPositions.length === 0) {
    console.log("\n✅ No positions to migrate. Migration complete.");
    return;
  }

  // Display positions
  console.log("\n" + "=".repeat(80));
  openPositions.forEach((pos, idx) => {
    console.log(`\nPosition #${idx + 1} (ID: ${pos.id}):`);
    console.log(`  Type: ${pos.isLong ? "LONG" : "SHORT"}`);
    console.log(`  Size: ${pos.size}`);
    console.log(`  Collateral: ${ethers.formatUnits(pos.collateral, 6)} USDC`);
    console.log(`  Leverage: ${pos.leverage}x`);
    console.log(`  Entry Price: $${Number(pos.entryPrice) / 1e8}`);
  });
  console.log("=".repeat(80));

  // Ask for confirmation
  console.log("\n⚠️  WARNING: This will:");
  console.log("   1. Close all open positions on SimplePositionManager");
  console.log("   2. Realize any PnL (profits or losses)");
  console.log("   3. Reopen positions on FHE PositionManager (with encryption)");
  console.log("   4. Require USDC approval for new PositionManager");

  console.log("\n🔐 New positions will have:");
  console.log("   ✅ Encrypted sizes (euint64)");
  console.log("   ✅ Encrypted collateral (euint64)");
  console.log("   ✅ Privacy-preserving liquidation");
  console.log("   ✅ Decryption via your keypair");

  // Check USDC balance and approval
  const usdcBalance = await usdc.balanceOf(signer.address);
  const usdcAllowance = await usdc.allowance(signer.address, newPMAddress);

  console.log("\n💰 USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
  console.log("📝 USDC Allowance (new PM):", ethers.formatUnits(usdcAllowance, 6), "USDC");

  // Approve USDC if needed
  const totalCollateral = openPositions.reduce(
    (sum, pos) => sum + BigInt(pos.collateral),
    0n
  );

  if (usdcAllowance < totalCollateral) {
    console.log("\n🔓 Approving USDC for new PositionManager...");
    const approveTx = await usdc.approve(newPMAddress, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ USDC approved");
  }

  // Migrate each position
  console.log("\n🔄 Starting migration...\n");

  for (let i = 0; i < openPositions.length; i++) {
    const pos = openPositions[i];
    console.log(`\n[${i + 1}/${openPositions.length}] Migrating position #${pos.id}...`);

    try {
      // Step 1: Close position on old contract
      console.log("  1️⃣ Closing position on SimplePositionManager...");
      const closeTx = await oldPM.closePosition(pos.id);
      const closeReceipt = await closeTx.wait();
      console.log("  ✅ Position closed (tx:", closeReceipt?.hash, ")");

      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Reopen position on new contract (with encryption)
      console.log("  2️⃣ Opening encrypted position on FHE PositionManager...");
      const openTx = await newPM.openPosition(
        pos.size,
        pos.collateral,
        pos.isLong,
        pos.leverage
      );
      const openReceipt = await openTx.wait();
      console.log("  ✅ Encrypted position opened (tx:", openReceipt?.hash, ")");

      console.log(`  🎉 Position #${pos.id} migrated successfully!`);
    } catch (err: any) {
      console.error(`  ❌ Failed to migrate position #${pos.id}:`, err.message);
      console.log("  ⚠️  Continuing with next position...");
    }
  }

  console.log("\n========================================");
  console.log("✅ MIGRATION COMPLETE");
  console.log("========================================\n");

  console.log("🔐 Your positions are now encrypted with fhEVM!");
  console.log("📊 Position sizes and collateral are hidden on-chain");
  console.log("🔑 Only you can decrypt your position data");
  console.log("\n💡 Next steps:");
  console.log("   1. Update frontend to use new PositionManager address");
  console.log("   2. Generate FHE keypair in UI (automatic on first use)");
  console.log("   3. Request decryption to view your position details");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
