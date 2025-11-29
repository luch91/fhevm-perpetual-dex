import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy FHE-Enabled PositionManager with Privacy Features
 *
 * This script deploys the full PositionManager contract that uses fhEVM
 * for encrypted position sizes and collateral amounts.
 */

async function main() {
  console.log("\n========================================");
  console.log("🔐 FHE POSITION MANAGER DEPLOYMENT");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get oracle address from environment
  const oracleAddress = process.env.CHAINLINK_ORACLE_ADDRESS || process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS;

  if (!oracleAddress) {
    throw new Error("CHAINLINK_ORACLE_ADDRESS not set in environment");
  }

  console.log("Using ChainlinkPriceOracle at:", oracleAddress);

  // Deploy PositionManager with FHE support
  console.log("\n📦 Deploying PositionManager (with FHE encryption)...");
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = await PositionManager.deploy(oracleAddress);
  await positionManager.waitForDeployment();

  const pmAddress = await positionManager.getAddress();
  console.log("✅ PositionManager deployed to:", pmAddress);

  // Deployment summary
  console.log("\n========================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("========================================\n");

  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("ChainlinkPriceOracle:", oracleAddress);
  console.log("PositionManager (FHE):", pmAddress);

  console.log("\n✨ Features Enabled:");
  console.log("-------------------");
  console.log("✅ Encrypted position sizes (euint64)");
  console.log("✅ Encrypted collateral amounts (euint64)");
  console.log("✅ Privacy-preserving liquidation checks");
  console.log("✅ Decryption via fhEVM gateway");
  console.log("✅ User keypair-based access control");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      priceOracle: oracleAddress,
      positionManager: pmAddress,
    },
    features: {
      encryption: true,
      fhevmVersion: "0.8",
      privacyEnabled: true,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, "fhe-position-manager.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", outputPath);

  // Update .env instructions
  console.log("\n========================================");
  console.log("📝 NEXT STEPS");
  console.log("========================================\n");

  console.log("1. Update your .env file with:");
  console.log(`   NEXT_PUBLIC_POSITION_MANAGER_ADDRESS="${pmAddress}"`);
  console.log(`   POSITION_MANAGER_ADDRESS="${pmAddress}"`);

  console.log("\n2. Update frontend configuration:");
  console.log("   packages/frontend/lib/contracts/addresses.ts");

  console.log("\n3. Users will need to:");
  console.log("   - Generate FHE keypair (automatic on first use)");
  console.log("   - Request decryption for their positions");
  console.log("   - Grant access permissions via ACL");

  console.log("\n4. Migration from SimplePositionManager:");
  console.log("   - Run: npm run migrate:to-fhe");
  console.log("   - Close old positions on SimplePositionManager");
  console.log("   - Reopen on new PositionManager with encryption");

  console.log("\n========================================");
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("========================================\n");

  console.log("🔐 Privacy features are now ACTIVE!");
  console.log("📊 Position sizes and collateral are encrypted on-chain");
  console.log("🔑 Only position owners can decrypt their data\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
