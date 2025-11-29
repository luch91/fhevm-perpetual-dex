import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Funding Rate Manager and Liquidation Keeper...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get existing contract addresses (update these with your deployed addresses)
  const CHAINLINK_ORACLE_ADDRESS = process.env.CHAINLINK_ORACLE_ADDRESS || "0x45328039a3F8a5502e34Ee9038b1649e33eF4600";
  const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS || "0x4cc313cd04647ec2380e7aFca10FfDdF528FE995";

  console.log("\nUsing existing contracts:");
  console.log("- ChainlinkPriceOracle:", CHAINLINK_ORACLE_ADDRESS);
  console.log("- SimplePositionManager:", POSITION_MANAGER_ADDRESS);

  // Deploy FundingRateManager
  console.log("\n1. Deploying FundingRateManager...");
  const FundingRateManager = await ethers.getContractFactory("FundingRateManager");
  const fundingRateManager = await FundingRateManager.deploy();
  await fundingRateManager.waitForDeployment();

  const fundingRateAddress = await fundingRateManager.getAddress();
  console.log("✓ FundingRateManager deployed to:", fundingRateAddress);

  // Deploy LiquidationKeeper
  console.log("\n2. Deploying LiquidationKeeper...");
  const LiquidationKeeper = await ethers.getContractFactory("LiquidationKeeper");
  const liquidationKeeper = await LiquidationKeeper.deploy(
    POSITION_MANAGER_ADDRESS,
    CHAINLINK_ORACLE_ADDRESS
  );
  await liquidationKeeper.waitForDeployment();

  const liquidationKeeperAddress = await liquidationKeeper.getAddress();
  console.log("✓ LiquidationKeeper deployed to:", liquidationKeeperAddress);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("FundingRateManager:", fundingRateAddress);
  console.log("LiquidationKeeper:", liquidationKeeperAddress);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Update .env with new addresses:");
  console.log(`   FUNDING_RATE_MANAGER_ADDRESS=${fundingRateAddress}`);
  console.log(`   LIQUIDATION_KEEPER_ADDRESS=${liquidationKeeperAddress}`);

  console.log("\n2. Update frontend config:");
  console.log("   - packages/frontend/lib/contracts/addresses.ts");

  console.log("\n3. Verify contracts on Etherscan (if deploying to testnet/mainnet):");
  console.log(`   npx hardhat verify --network sepolia ${fundingRateAddress}`);
  console.log(`   npx hardhat verify --network sepolia ${liquidationKeeperAddress} ${POSITION_MANAGER_ADDRESS} ${CHAINLINK_ORACLE_ADDRESS}`);

  console.log("\n4. Test funding rate updates:");
  console.log("   - Call updateFundingRate() with sample open interest data");

  console.log("\n5. Set up liquidation keeper bot:");
  console.log("   - Run keeper script to monitor positions");
  console.log("   - Liquidate undercollateralized positions");

  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
