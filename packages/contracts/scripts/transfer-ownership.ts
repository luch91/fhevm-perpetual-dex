import { ethers } from "hardhat";

async function main() {
  const FUNDING_MANAGER_ADDRESS = "0x4848336ED7603b79e45325B03e12C6a938F8626E";
  const POSITION_MANAGER_ADDRESS = "0xa331c2Fccbaa812a84AC4941a44CC071C1af8f3e";

  console.log("\n" + "=".repeat(70));
  console.log("TRANSFER FUNDING MANAGER OWNERSHIP");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Get FundingRateManager contract
  const fundingManager = await ethers.getContractAt(
    "FundingRateManager",
    FUNDING_MANAGER_ADDRESS
  );

  // Check current owner
  const currentOwner = await fundingManager.owner();
  console.log("Current Owner:", currentOwner);
  console.log("New Owner (PositionManager):", POSITION_MANAGER_ADDRESS);

  if (currentOwner.toLowerCase() === POSITION_MANAGER_ADDRESS.toLowerCase()) {
    console.log("\n✓ Ownership already transferred!");
    return;
  }

  // Transfer ownership
  console.log("\nTransferring ownership...");
  const tx = await fundingManager.transferOwnership(POSITION_MANAGER_ADDRESS);
  await tx.wait();

  console.log("✓ Ownership transferred!");

  // Verify
  const newOwner = await fundingManager.owner();
  console.log("✓ New owner:", newOwner);
  console.log("✓ Match:", newOwner.toLowerCase() === POSITION_MANAGER_ADDRESS.toLowerCase());

  console.log("\n" + "=".repeat(70));
  console.log("SUCCESS - PositionManager can now update funding rates");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
