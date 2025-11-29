import { ethers } from "hardhat";

/**
 * Update PositionManager to use ChainlinkPriceOracle
 * Run: npx hardhat run scripts/update-position-manager-oracle.ts --network sepolia
 */
async function main() {
  console.log("Updating PositionManager oracle to ChainlinkPriceOracle...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get addresses from environment
  const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
  const chainlinkOracleAddress = process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS;

  if (!positionManagerAddress) {
    throw new Error("NEXT_PUBLIC_POSITION_MANAGER_ADDRESS not set");
  }

  if (!chainlinkOracleAddress) {
    throw new Error("NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS not set");
  }

  console.log("PositionManager:", positionManagerAddress);
  console.log("New Oracle (Chainlink):", chainlinkOracleAddress);

  // Get PositionManager contract instance
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = PositionManager.attach(positionManagerAddress);

  // Check current oracle
  const currentOracle = await positionManager.priceOracle();
  console.log("\nCurrent oracle:", currentOracle);

  if (currentOracle.toLowerCase() === chainlinkOracleAddress.toLowerCase()) {
    console.log("\n✓ Oracle is already set to ChainlinkPriceOracle. No update needed.");
    return;
  }

  console.log("\nUpdating oracle to ChainlinkPriceOracle...");

  // Update the oracle
  const tx = await positionManager.setPriceOracle(chainlinkOracleAddress);
  console.log("Transaction sent:", tx.hash);

  await tx.wait();
  console.log("✓ Transaction confirmed");

  // Verify the update
  const newOracle = await positionManager.priceOracle();
  console.log("\nUpdated oracle:", newOracle);

  if (newOracle.toLowerCase() === chainlinkOracleAddress.toLowerCase()) {
    console.log("\n✅ SUCCESS: PositionManager now uses ChainlinkPriceOracle");
    console.log("\nYou can now open positions with live Chainlink price feeds!");
  } else {
    console.log("\n❌ ERROR: Oracle update failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
