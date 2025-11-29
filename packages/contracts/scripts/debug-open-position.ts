import { ethers } from "hardhat";

async function main() {
  console.log("Debugging openPosition transaction...\n");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
  if (!positionManagerAddress) {
    throw new Error("NEXT_PUBLIC_POSITION_MANAGER_ADDRESS not set");
  }

  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = PositionManager.attach(positionManagerAddress);

  // Check oracle
  const oracleAddress = await positionManager.priceOracle();
  console.log("Oracle address:", oracleAddress);

  // Get price from oracle
  const PriceOracle = await ethers.getContractAt("ChainlinkPriceOracle", oracleAddress);

  try {
    const [price, decimals, timestamp] = await PriceOracle.getPrice("BTC/USD");
    console.log("\nBTC/USD Price:");
    console.log("  Price:", ethers.formatUnits(price, decimals));
    console.log("  Decimals:", decimals);
    console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());

    const isFresh = await PriceOracle.isPriceFresh("BTC/USD");
    console.log("  Is Fresh:", isFresh);
  } catch (error: any) {
    console.error("Error getting price:", error.message);
  }

  // Try to estimate gas for openPosition
  console.log("\nAttempting to open position...");
  console.log("Parameters:");
  console.log("  size: 500");
  console.log("  collateral: 300");
  console.log("  isLong: true");
  console.log("  leverage: 1");

  try {
    const gas = await positionManager.openPosition.estimateGas(
      500,    // size
      300,    // collateral
      true,   // isLong
      1       // leverage
    );
    console.log("\n✓ Gas estimate succeeded:", gas.toString());
    console.log("This means the transaction should work!");
  } catch (error: any) {
    console.error("\n❌ Gas estimation failed:");
    console.error("Error:", error.message);

    if (error.data) {
      console.error("Error data:", error.data);
    }

    // Try to get more details
    try {
      const tx = await positionManager.openPosition.staticCall(500, 300, true, 1);
      console.log("Static call succeeded (should not reach here)");
    } catch (staticError: any) {
      console.error("\nStatic call error:", staticError.message);

      // Try to decode the revert reason
      if (staticError.data) {
        try {
          const reason = ethers.toUtf8String(staticError.data);
          console.error("Revert reason:", reason);
        } catch {
          console.error("Could not decode revert reason");
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
