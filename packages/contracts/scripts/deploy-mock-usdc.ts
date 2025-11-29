import { ethers } from "hardhat";

/**
 * Deploy MockUSDC token for testing
 *
 * This script:
 * 1. Deploys MockUSDC contract
 * 2. Mints initial supply to deployer
 * 3. Outputs contract address for use in .env
 */
async function main() {
  console.log("Deploying MockUSDC to Sepolia testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✓ MockUSDC deployed to:", mockUSDCAddress);

  // Check initial balance
  const deployerBalance = await mockUSDC.balanceOf(deployer.address);
  console.log("✓ Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6), "USDC");

  // Get token details
  const name = await mockUSDC.name();
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();

  console.log("\nToken Details:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Decimals:", decimals);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL");
  console.log("=".repeat(60));
  console.log("\nAdd this to your .env and .env.local files:");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS="${mockUSDCAddress}"`);
  console.log(`USDC_ADDRESS="${mockUSDCAddress}"`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("\n1. Update environment variables:");
  console.log(`   Add NEXT_PUBLIC_USDC_ADDRESS="${mockUSDCAddress}" to .env.local`);
  console.log("\n2. To mint more USDC for testing, run:");
  console.log(`   npx hardhat run scripts/mint-usdc.ts --network sepolia`);
  console.log("\n3. Or use the contract directly:");
  console.log(`   mockUSDC.mint(yourAddress, amount * 1e6)`);
  console.log("\n4. View on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${mockUSDCAddress}`);

  console.log("\n" + "=".repeat(60));
  console.log("PUBLIC MINT FUNCTION");
  console.log("=".repeat(60));
  console.log("\nAnyone can mint tokens by calling:");
  console.log(`mockUSDC.mint(address, amount)`);
  console.log("\nExample: Mint 1000 USDC to yourself:");
  console.log(`mockUSDC.mint("YOUR_ADDRESS", 1000 * 10**6)`);
  console.log("\nOr use the helper function:");
  console.log(`mockUSDC.mintWithDecimals("YOUR_ADDRESS", 1000) // Mints 1000 USDC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
