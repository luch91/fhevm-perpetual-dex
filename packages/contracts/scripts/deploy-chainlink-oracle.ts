import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ChainlinkPriceOracle to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy ChainlinkPriceOracle
  console.log("\nDeploying ChainlinkPriceOracle...");
  const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
  const oracle = await ChainlinkPriceOracle.deploy();
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();
  console.log("ChainlinkPriceOracle deployed to:", oracleAddress);

  // Verify the feeds are set up correctly
  console.log("\nVerifying price feeds...");

  const btcFeedInfo = await oracle.getPriceFeedInfo("BTC/USD");
  console.log("BTC/USD Feed:");
  console.log("  Address:", btcFeedInfo.feedAddress);
  console.log("  Decimals:", btcFeedInfo.decimals);
  console.log("  Description:", btcFeedInfo.description);
  console.log("  Active:", btcFeedInfo.isActive);

  const ethFeedInfo = await oracle.getPriceFeedInfo("ETH/USD");
  console.log("ETH/USD Feed:");
  console.log("  Address:", ethFeedInfo.feedAddress);
  console.log("  Decimals:", ethFeedInfo.decimals);
  console.log("  Description:", ethFeedInfo.description);
  console.log("  Active:", ethFeedInfo.isActive);

  // Fetch live prices
  console.log("\nFetching live prices from Chainlink...");

  try {
    const btcPrice = await oracle.getPrice("BTC/USD");
    console.log("BTC/USD Price:");
    console.log("  Price:", ethers.formatUnits(btcPrice.price, btcPrice.decimals));
    console.log("  Decimals:", btcPrice.decimals);
    console.log("  Updated:", new Date(Number(btcPrice.timestamp) * 1000).toISOString());

    const ethPrice = await oracle.getPrice("ETH/USD");
    console.log("ETH/USD Price:");
    console.log("  Price:", ethers.formatUnits(ethPrice.price, ethPrice.decimals));
    console.log("  Decimals:", ethPrice.decimals);
    console.log("  Updated:", new Date(Number(ethPrice.timestamp) * 1000).toISOString());

    // Check if prices are fresh
    const btcFresh = await oracle.isPriceFresh("BTC/USD");
    const ethFresh = await oracle.isPriceFresh("ETH/USD");
    console.log("\nPrice Freshness:");
    console.log("  BTC/USD is fresh:", btcFresh);
    console.log("  ETH/USD is fresh:", ethFresh);
  } catch (error) {
    console.error("Error fetching prices:", error);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("ChainlinkPriceOracle:", oracleAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS=${oracleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
