import { ethers } from "hardhat";

/**
 * Deploy SimplePositionManager (non-FHE version for Sepolia demo)
 * Run: npx hardhat run scripts/deploy-simple-position-manager.ts --network sepolia
 */
async function main() {
  console.log("Deploying Simple PositionManager (non-FHE)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get Chainlink Oracle address
  const chainlinkOracleAddress = process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS;
  if (!chainlinkOracleAddress) {
    throw new Error("NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS not set");
  }

  console.log("Using Chainlink Oracle:", chainlinkOracleAddress);

  // Deploy SimplePositionManager
  const SimplePositionManager = await ethers.getContractFactory("SimplePositionManager");
  const positionManager = await SimplePositionManager.deploy(chainlinkOracleAddress);

  await positionManager.waitForDeployment();

  const address = await positionManager.getAddress();
  console.log("\n✅ SimplePositionManager deployed to:", address);

  console.log("\n📋 Update your .env files with:");
  console.log(`NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="${address}"`);
  console.log(`POSITION_MANAGER_ADDRESS="${address}"`);

  console.log("\n⚠️  NOTE: This is a NON-ENCRYPTED version for demo purposes");
  console.log("For production with privacy, deploy the full PositionManager with fhEVM coprocessor");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
