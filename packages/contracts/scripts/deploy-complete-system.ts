import { ethers } from "hardhat";

/**
 * Complete System Deployment Script
 * Deploys all contracts in the correct order:
 * 1. FundingRateManager
 * 2. LiquidationKeeper (needs placeholder address initially)
 * 3. SimplePositionManager (with funding and liquidation)
 * 4. Update LiquidationKeeper with real PositionManager address
 */
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("COMPLETE SYSTEM DEPLOYMENT - fhEVM Perpetual DEX");
  console.log("=".repeat(70) + "\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH\n");

  // Get existing addresses from env
  const CHAINLINK_ORACLE_ADDRESS = process.env.CHAINLINK_ORACLE_ADDRESS;
  const USDC_ADDRESS = process.env.USDC_ADDRESS;

  if (!CHAINLINK_ORACLE_ADDRESS) {
    throw new Error("CHAINLINK_ORACLE_ADDRESS not set in .env");
  }
  if (!USDC_ADDRESS) {
    throw new Error("USDC_ADDRESS not set in .env");
  }

  console.log("Using ChainlinkPriceOracle:", CHAINLINK_ORACLE_ADDRESS);
  console.log("Using MockUSDC:", USDC_ADDRESS);
  console.log("\n" + "-".repeat(70));

  // STEP 1: Deploy FundingRateManager
  console.log("\n[1/4] Deploying FundingRateManager...");
  const FundingRateManager = await ethers.getContractFactory("FundingRateManager");
  const fundingRateManager = await FundingRateManager.deploy();
  await fundingRateManager.waitForDeployment();

  const fundingRateAddress = await fundingRateManager.getAddress();
  console.log("✓ FundingRateManager deployed:", fundingRateAddress);

  // STEP 2: Deploy SimplePositionManager (temporarily use deployer as keeper)
  console.log("\n[2/4] Deploying SimplePositionManager...");

  // We'll use the deployer address as a placeholder for liquidation keeper initially
  const SimplePositionManager = await ethers.getContractFactory("SimplePositionManager");
  const simplePositionManager = await SimplePositionManager.deploy(
    CHAINLINK_ORACLE_ADDRESS,
    fundingRateAddress,
    deployer.address,  // Temporary placeholder for keeper
    USDC_ADDRESS  // NEW: USDC token address
  );
  await simplePositionManager.waitForDeployment();

  const positionManagerAddress = await simplePositionManager.getAddress();
  console.log("✓ SimplePositionManager deployed:", positionManagerAddress);

  // STEP 3: Deploy LiquidationKeeper with real PositionManager address
  console.log("\n[3/4] Deploying LiquidationKeeper...");
  const LiquidationKeeper = await ethers.getContractFactory("LiquidationKeeper");
  const liquidationKeeper = await LiquidationKeeper.deploy(
    positionManagerAddress,
    CHAINLINK_ORACLE_ADDRESS
  );
  await liquidationKeeper.waitForDeployment();

  const liquidationKeeperAddress = await liquidationKeeper.getAddress();
  console.log("✓ LiquidationKeeper deployed:", liquidationKeeperAddress);

  // STEP 4: Update SimplePositionManager with real LiquidationKeeper address
  console.log("\n[4/4] Updating SimplePositionManager with LiquidationKeeper address...");
  const tx = await simplePositionManager.setLiquidationKeeper(liquidationKeeperAddress);
  await tx.wait();
  console.log("✓ SimplePositionManager updated with LiquidationKeeper");

  // Display summary
  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));

  console.log("\n📋 Contract Addresses:");
  console.log("-".repeat(70));
  console.log("ChainlinkPriceOracle:      ", CHAINLINK_ORACLE_ADDRESS);
  console.log("FundingRateManager:        ", fundingRateAddress);
  console.log("LiquidationKeeper:         ", liquidationKeeperAddress);
  console.log("SimplePositionManager:     ", positionManagerAddress);

  console.log("\n" + "=".repeat(70));
  console.log("NEXT STEPS");
  console.log("=".repeat(70));

  console.log("\n1️⃣  Update .env file:");
  console.log("---");
  console.log(`FUNDING_RATE_MANAGER_ADDRESS="${fundingRateAddress}"`);
  console.log(`LIQUIDATION_KEEPER_ADDRESS="${liquidationKeeperAddress}"`);
  console.log(`POSITION_MANAGER_ADDRESS="${positionManagerAddress}"`);
  console.log(`NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="${positionManagerAddress}"`);
  console.log(`NEXT_PUBLIC_FUNDING_RATE_MANAGER_ADDRESS="${fundingRateAddress}"`);
  console.log(`NEXT_PUBLIC_LIQUIDATION_KEEPER_ADDRESS="${liquidationKeeperAddress}"`);

  console.log("\n2️⃣  Update frontend/.env.local:");
  console.log("---");
  console.log(`NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="${positionManagerAddress}"`);
  console.log(`NEXT_PUBLIC_FUNDING_RATE_MANAGER_ADDRESS="${fundingRateAddress}"`);
  console.log(`NEXT_PUBLIC_LIQUIDATION_KEEPER_ADDRESS="${liquidationKeeperAddress}"`);

  console.log("\n3️⃣  Verify contracts on Etherscan:");
  console.log("---");
  console.log(`npx hardhat verify --network sepolia ${fundingRateAddress}`);
  console.log(`npx hardhat verify --network sepolia ${liquidationKeeperAddress} ${positionManagerAddress} ${CHAINLINK_ORACLE_ADDRESS}`);
  console.log(`npx hardhat verify --network sepolia ${positionManagerAddress} ${CHAINLINK_ORACLE_ADDRESS} ${fundingRateAddress} ${liquidationKeeperAddress} ${USDC_ADDRESS}`);

  console.log("\n4️⃣  Test the system:");
  console.log("---");
  console.log("• Open a position");
  console.log("• Check funding rate is initialized");
  console.log("• Close position and verify funding payment");
  console.log("• Test liquidation with undercollateralized position");

  console.log("\n5️⃣  Start liquidation keeper bot:");
  console.log("---");
  console.log("npx hardhat run scripts/run-liquidation-keeper.ts --network sepolia");

  console.log("\n" + "=".repeat(70) + "\n");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      chainlinkOracle: CHAINLINK_ORACLE_ADDRESS,
      fundingRateManager: fundingRateAddress,
      liquidationKeeper: liquidationKeeperAddress,
      simplePositionManager: positionManagerAddress,
    }
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-complete.json");

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentPath);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
