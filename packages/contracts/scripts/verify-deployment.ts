import { ethers } from "hardhat";

async function main() {
  const PM_ADDRESS = "0xa331c2Fccbaa812a84AC4941a44CC071C1af8f3e";
  const USDC_ADDRESS = "0xD443Fe9E97732EBE6Cc5A6D638D5cda3A1F489DF";

  console.log("Verifying SimplePositionManager deployment...\n");

  // Get contract instance
  const pm = await ethers.getContractAt("SimplePositionManager", PM_ADDRESS);

  // Check USDC address
  const usdcToken = await pm.usdcToken();
  console.log("✓ USDC Token Address:", usdcToken);
  console.log("  Expected:", USDC_ADDRESS);
  console.log("  Match:", usdcToken.toLowerCase() === USDC_ADDRESS.toLowerCase());

  // Check oracle address
  const oracle = await pm.priceOracle();
  console.log("\n✓ Price Oracle:", oracle);

  // Check funding manager
  const fundingManager = await pm.fundingRateManager();
  console.log("✓ Funding Manager:", fundingManager);

  // Check liquidation keeper
  const keeper = await pm.liquidationKeeper();
  console.log("✓ Liquidation Keeper:", keeper);

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("\n✓ Deployer:", deployer.address);

  // Check USDC balance
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const balance = await usdc.balanceOf(deployer.address);
  console.log("✓ USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

  // Check allowance
  const allowance = await usdc.allowance(deployer.address, PM_ADDRESS);
  console.log("✓ USDC Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYMENT VERIFICATION COMPLETE");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
