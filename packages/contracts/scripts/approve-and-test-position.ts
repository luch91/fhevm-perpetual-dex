import { ethers } from "hardhat";

async function main() {
  const PM_ADDRESS = "0xa331c2Fccbaa812a84AC4941a44CC071C1af8f3e";
  const USDC_ADDRESS = "0xD443Fe9E97732EBE6Cc5A6D638D5cda3A1F489DF";

  console.log("\n" + "=".repeat(70));
  console.log("APPROVE USDC AND TEST POSITION");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const pm = await ethers.getContractAt("SimplePositionManager", PM_ADDRESS);

  // Check current USDC balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

  // Step 1: Approve USDC
  console.log("\n[1/3] Approving USDC spending...");
  const approveAmount = ethers.parseUnits("100000", 6); // 100k USDC
  const approveTx = await usdc.approve(PM_ADDRESS, approveAmount);
  await approveTx.wait();
  console.log("✓ Approved", ethers.formatUnits(approveAmount, 6), "USDC");

  // Verify allowance
  const allowance = await usdc.allowance(deployer.address, PM_ADDRESS);
  console.log("✓ Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  // Step 2: Open a test position
  console.log("\n[2/3] Opening test position...");
  const size = 100; // 100 units
  const collateral = ethers.parseUnits("1000", 6); // 1000 USDC
  const isLong = true;
  const leverage = 2;

  console.log("Parameters:");
  console.log("  Size:", size);
  console.log("  Collateral:", ethers.formatUnits(collateral, 6), "USDC");
  console.log("  Direction:", isLong ? "LONG" : "SHORT");
  console.log("  Leverage:", leverage + "x");

  const openTx = await pm.openPosition(size, collateral, isLong, leverage);
  const receipt = await openTx.wait();
  console.log("✓ Position opened!");
  console.log("✓ Transaction:", receipt?.hash);

  // Find the PositionOpened event
  const positionOpenedEvent = receipt?.logs.find((log: any) => {
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

  if (positionOpenedEvent) {
    const parsed = pm.interface.parseLog({
      topics: positionOpenedEvent.topics as string[],
      data: positionOpenedEvent.data,
    });
    console.log("\n📊 Position Details:");
    console.log("  Position ID:", parsed?.args.positionId.toString());
    console.log("  Entry Price:", ethers.formatUnits(parsed?.args.entryPrice, 8));
    console.log("  Is Long:", parsed?.args.isLong);
  }

  // Step 3: Verify USDC was transferred
  console.log("\n[3/3] Verifying USDC transfer...");
  const newBalance = await usdc.balanceOf(deployer.address);
  const contractBalance = await usdc.balanceOf(PM_ADDRESS);

  console.log("✓ User Balance:", ethers.formatUnits(newBalance, 6), "USDC");
  console.log("✓ Contract Balance:", ethers.formatUnits(contractBalance, 6), "USDC");
  console.log("✓ Transferred:", ethers.formatUnits(balance - newBalance, 6), "USDC");

  console.log("\n" + "=".repeat(70));
  console.log("SUCCESS - Position opened with USDC collateral!");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });
