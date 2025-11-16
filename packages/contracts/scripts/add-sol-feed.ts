import { ethers } from "hardhat";

async function main() {
  console.log("Adding SOL/USD price to ChainlinkPriceOracle...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // ChainlinkPriceOracle address from previous deployment
  const oracleAddress = "0x4BbeEEd91B88ee96f83ceCE3F8f7448A8CdFfaFd";

  const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
  const oracle = ChainlinkPriceOracle.attach(oracleAddress);

  console.log("Connected to ChainlinkPriceOracle at:", oracleAddress);

  // Note: Since Pyth Network isn't available on Ethereum Sepolia yet,
  // we'll add SOL/USD to the regular PriceOracle contract instead
  // for manual updates via the update-price.ts script

  console.log("\nNote: For SOL/USD prices, use the PriceOracle contract with manual updates");
  console.log("Run: npx hardhat run scripts/update-price.ts --network sepolia");
  console.log("This allows setting SOL/USD price manually until Pyth Network deploys on Ethereum Sepolia");

  // Get existing feeds
  console.log("\nCurrent Chainlink Feeds:");

  const btcFeed = await oracle.getPriceFeedInfo("BTC/USD");
  console.log("BTC/USD:", btcFeed.feedAddress);

  const ethFeed = await oracle.getPriceFeedInfo("ETH/USD");
  console.log("ETH/USD:", ethFeed.feedAddress);

  // Fetch current prices
  console.log("\nCurrent Prices from Chainlink:");
  const btcPrice = await oracle.getPrice("BTC/USD");
  console.log("BTC/USD:", ethers.formatUnits(btcPrice.price, btcPrice.decimals));

  const ethPrice = await oracle.getPrice("ETH/USD");
  console.log("ETH/USD:", ethers.formatUnits(ethPrice.price, ethPrice.decimals));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
