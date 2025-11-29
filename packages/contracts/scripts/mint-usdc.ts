import { ethers } from "hardhat";

/**
 * Mint MockUSDC tokens to a specified address
 *
 * Usage:
 * npx hardhat run scripts/mint-usdc.ts --network sepolia
 *
 * Set MINT_TO_ADDRESS and MINT_AMOUNT in your .env file, or edit below
 */
async function main() {
  console.log("Minting MockUSDC tokens...\n");

  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);

  // Get MockUSDC address from environment or use default
  const mockUSDCAddress = process.env.USDC_ADDRESS || process.env.NEXT_PUBLIC_USDC_ADDRESS;

  if (!mockUSDCAddress) {
    console.error("\n❌ ERROR: USDC_ADDRESS not found in .env");
    console.error("Please set USDC_ADDRESS in your .env file");
    console.error("Or deploy MockUSDC first: npx hardhat run scripts/deploy-mock-usdc.ts --network sepolia");
    process.exit(1);
  }

  console.log("MockUSDC address:", mockUSDCAddress);

  // Get MockUSDC contract
  const MockUSDC = await ethers.getContractAt("MockUSDC", mockUSDCAddress);

  // Mint parameters
  const mintToAddress = process.env.MINT_TO_ADDRESS || signer.address;
  const mintAmount = process.env.MINT_AMOUNT || "10000"; // Default: 10,000 USDC

  console.log("\nMint Parameters:");
  console.log("- To address:", mintToAddress);
  console.log("- Amount:", mintAmount, "USDC");

  // Check balance before minting
  const balanceBefore = await MockUSDC.balanceOf(mintToAddress);
  console.log("\nBalance before:", ethers.formatUnits(balanceBefore, 6), "USDC");

  // Mint tokens (using helper function for automatic decimal conversion)
  console.log("\nMinting...");
  const tx = await MockUSDC.mintWithDecimals(mintToAddress, mintAmount);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✓ Transaction confirmed");

  // Check balance after minting
  const balanceAfter = await MockUSDC.balanceOf(mintToAddress);
  console.log("\nBalance after:", ethers.formatUnits(balanceAfter, 6), "USDC");

  const mintedAmount = balanceAfter - balanceBefore;
  console.log("✓ Minted:", ethers.formatUnits(mintedAmount, 6), "USDC");

  console.log("\n" + "=".repeat(60));
  console.log("MINTING SUCCESSFUL");
  console.log("=".repeat(60));
  console.log("\nYou can now use these USDC tokens for trading!");
  console.log("\nNext steps:");
  console.log("1. Approve PositionManager to spend your USDC");
  console.log("2. Open a position on the trading interface");
  console.log("\nView transaction on Etherscan:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
