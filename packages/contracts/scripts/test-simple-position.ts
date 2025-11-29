import { ethers } from "hardhat";

async function main() {
  console.log("Testing SimplePositionManager...\n");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const positionManagerAddress = "0x4cc313cd04647ec2380e7aFca10FfDdF528FE995";

  const PositionManager = await ethers.getContractFactory("SimplePositionManager");
  const positionManager = PositionManager.attach(positionManagerAddress);

  console.log("Attempting to open position...");
  console.log("  size: 500");
  console.log("  collateral: 300");
  console.log("  isLong: true");
  console.log("  leverage: 1");

  try {
    const gas = await positionManager.openPosition.estimateGas(500, 300, true, 1);
    console.log("\n✅ Gas estimate succeeded:", gas.toString());

    // Actually open the position
    const tx = await positionManager.openPosition(500, 300, true, 1);
    console.log("\nTransaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

    // Get position count
    const count = await positionManager.getPositionCount(signer.address);
    console.log("\nTotal positions:", count.toString());

    console.log("\n🎉 SUCCESS! Position opened successfully!");
  } catch (error: any) {
    console.error("\n❌ Failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
