import { ethers } from "hardhat";

/**
 * Liquidation Keeper Bot
 * Monitors positions and liquidates undercollateralized ones
 * Run with: npx hardhat run scripts/run-liquidation-keeper.ts --network sepolia
 */

const CHECK_INTERVAL = 60000; // Check every 60 seconds
const MAX_POSITIONS_PER_CHECK = 50; // Scan up to 50 positions

async function main() {
  console.log("Starting Liquidation Keeper Bot...\n");

  const [keeper] = await ethers.getSigners();
  console.log("Keeper address:", keeper.address);

  const LIQUIDATION_KEEPER_ADDRESS = process.env.LIQUIDATION_KEEPER_ADDRESS;

  if (!LIQUIDATION_KEEPER_ADDRESS) {
    console.error("Error: LIQUIDATION_KEEPER_ADDRESS not set in .env");
    process.exit(1);
  }

  const liquidationKeeper = await ethers.getContractAt(
    "LiquidationKeeper",
    LIQUIDATION_KEEPER_ADDRESS
  );

  console.log("LiquidationKeeper:", LIQUIDATION_KEEPER_ADDRESS);
  console.log("Check interval:", CHECK_INTERVAL / 1000, "seconds");
  console.log("\nMonitoring for liquidatable positions...\n");

  // Check if paused
  const isPaused = await liquidationKeeper.isPaused();
  if (isPaused) {
    console.error("Error: Liquidations are currently paused");
    process.exit(1);
  }

  let checkCount = 0;

  // Main monitoring loop
  async function checkAndLiquidate() {
    checkCount++;
    console.log(`[Check #${checkCount}] ${new Date().toLocaleTimeString()}`);

    try {
      // Get liquidatable positions
      const liquidatablePositions = await liquidationKeeper.getLiquidatablePositions(
        MAX_POSITIONS_PER_CHECK
      );

      if (liquidatablePositions.length === 0) {
        console.log("  No liquidatable positions found");
        return;
      }

      console.log(`  Found ${liquidatablePositions.length} liquidatable position(s)`);

      // Batch liquidate if multiple positions
      if (liquidatablePositions.length > 1) {
        console.log(`  Batch liquidating ${liquidatablePositions.length} positions...`);

        try {
          const tx = await liquidationKeeper.batchLiquidate(liquidatablePositions);
          console.log(`  Transaction sent: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`  ✓ Batch liquidation successful! Gas used: ${receipt?.gasUsed}`);

          // Get total reward from events
          const events = receipt?.logs || [];
          let totalReward = BigInt(0);

          for (const event of events) {
            try {
              const parsed = liquidationKeeper.interface.parseLog(event as any);
              if (parsed?.name === "PositionLiquidated") {
                totalReward += parsed.args.reward;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          console.log(`  Total reward: ${ethers.formatUnits(totalReward, 6)} USDC`);
        } catch (error: any) {
          console.error(`  Error batch liquidating:`, error.message);
        }
      } else {
        // Single liquidation
        const positionId = liquidatablePositions[0];
        console.log(`  Liquidating position #${positionId}...`);

        try {
          const tx = await liquidationKeeper.liquidatePosition(positionId);
          console.log(`  Transaction sent: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`  ✓ Liquidation successful! Gas used: ${receipt?.gasUsed}`);

          // Get reward from event
          const event = receipt?.logs?.find((log) => {
            try {
              const parsed = liquidationKeeper.interface.parseLog(log as any);
              return parsed?.name === "PositionLiquidated";
            } catch {
              return false;
            }
          });

          if (event) {
            const parsed = liquidationKeeper.interface.parseLog(event as any);
            const reward = parsed?.args.reward;
            console.log(`  Reward: ${ethers.formatUnits(reward, 6)} USDC`);
          }
        } catch (error: any) {
          console.error(`  Error liquidating position #${positionId}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error(`  Error checking positions:`, error.message);
    }

    console.log(""); // Empty line for readability
  }

  // Initial check
  await checkAndLiquidate();

  // Set up interval
  setInterval(checkAndLiquidate, CHECK_INTERVAL);

  console.log("Keeper bot is running. Press Ctrl+C to stop.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
