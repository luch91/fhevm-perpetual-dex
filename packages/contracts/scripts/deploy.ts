import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment of fhEVM Perpetual DEX...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy PositionManager
  console.log("Deploying PositionManager...");
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = await PositionManager.deploy();
  await positionManager.waitForDeployment();
  const positionManagerAddress = await positionManager.getAddress();
  console.log("✓ PositionManager deployed to:", positionManagerAddress);

  // Deploy PerpetualDEX
  console.log("\nDeploying PerpetualDEX...");
  const PerpetualDEX = await ethers.getContractFactory("PerpetualDEX");
  const perpetualDEX = await PerpetualDEX.deploy(positionManagerAddress);
  await perpetualDEX.waitForDeployment();
  const perpetualDEXAddress = await perpetualDEX.getAddress();
  console.log("✓ PerpetualDEX deployed to:", perpetualDEXAddress);

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("PositionManager:", positionManagerAddress);
  console.log("PerpetualDEX:", perpetualDEXAddress);
  console.log("\nDeployer:", deployer.address);
  console.log("=".repeat(60));

  // Save deployment info
  console.log("\n⚠ IMPORTANT: Update your .env file with these addresses:");
  console.log(`POSITION_MANAGER_ADDRESS=${positionManagerAddress}`);
  console.log(`PERPETUAL_DEX_ADDRESS=${perpetualDEXAddress}`);
  console.log(`\nNEXT_PUBLIC_POSITION_MANAGER_ADDRESS=${positionManagerAddress}`);
  console.log(`NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS=${perpetualDEXAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
