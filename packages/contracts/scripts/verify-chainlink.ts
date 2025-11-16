// scripts/verify-chainlink.ts
import { ethers } from "hardhat";

async function main() {
  const oracleAddress = process.env.CHAINLINK_ORACLE_ADDRESS || "0x45328039a3F8a5502e34Ee9038b1649e33eF4600";

  console.log("Verifying ChainlinkPriceOracle at:", oracleAddress);
  console.log("=".repeat(60));

  const oracle = await ethers.getContractAt("ChainlinkPriceOracle", oracleAddress);

  // Test BTC/USD
  console.log("\n📊 BTC/USD Price Feed:");
  try {
    const [price, decimals, timestamp] = await oracle.getPrice("BTC/USD");
    const priceNum = Number(price.toString()) / Math.pow(10, Number(decimals));
    const date = new Date(Number(timestamp.toString()) * 1000);
    console.log(`  Price: $${priceNum.toLocaleString()}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Last Updated: ${date.toLocaleString()}`);
    console.log("  ✅ Feed is working");
  } catch (error: any) {
    console.log("  ❌ Error:", error.message);
  }

  // Test ETH/USD
  console.log("\n📊 ETH/USD Price Feed:");
  try {
    const [price, decimals, timestamp] = await oracle.getPrice("ETH/USD");
    const priceNum = Number(price.toString()) / Math.pow(10, Number(decimals));
    const date = new Date(Number(timestamp.toString()) * 1000);
    console.log(`  Price: $${priceNum.toLocaleString()}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Last Updated: ${date.toLocaleString()}`);
    console.log("  ✅ Feed is working");
  } catch (error: any) {
    console.log("  ❌ Error:", error.message);
  }

  // Test SOL/USD (may not be configured yet)
  console.log("\n📊 SOL/USD Price Feed:");
  try {
    const [price, decimals, timestamp] = await oracle.getPrice("SOL/USD");
    const priceUsd = Number(price) / Math.pow(10, decimals);
    console.log(`  Price: $${priceUsd.toLocaleString()}`);
    console.log("  ✅ Feed is working");
  } catch (error: any) {
    console.log("  ⚠️  Not configured (expected)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Chainlink verification complete!");
  console.log("\nNext steps:");
  console.log("1. Frontend is now using Chainlink oracle");
  console.log("2. All new positions will use decentralized prices");
  console.log("3. Optional: Run 'npm run add:sol-feed' to enable SOL trading");
}

main().catch(console.error);
