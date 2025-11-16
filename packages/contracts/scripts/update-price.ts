// scripts/update-price.ts
import { ethers } from "hardhat";

// Fetch real-time prices from CoinGecko API
async function fetchRealTimePrices() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      'BTC/USD': Math.floor(data.bitcoin.usd * 1e8),
      'ETH/USD': Math.floor(data.ethereum.usd * 1e8),
      'SOL/USD': Math.floor(data.solana.usd * 1e8),
    };
  } catch (error) {
    console.error('Failed to fetch real-time prices:', error);
    console.log('Falling back to mock prices...');

    // Fallback to reasonable mock prices
    return {
      'BTC/USD': 97234e8,
      'ETH/USD': 3456e8,
      'SOL/USD': 150e8,
    };
  }
}

async function main() {
  // Use the deployed oracle address from environment
  const oracleAddress = process.env.PRICE_ORACLE_ADDRESS || "0xC201C14DFA83F659B32e4d625209c54cb9B7D120";

  console.log(`Using PriceOracle at: ${oracleAddress}`);

  const oracle = await ethers.getContractAt("PriceOracle", oracleAddress);

  // Fetch real-time prices
  console.log('Fetching real-time prices from CoinGecko...');
  const prices = await fetchRealTimePrices();

  const updates = [
    { asset: "BTC/USD", price: prices['BTC/USD'], decimals: 8 },
    { asset: "ETH/USD", price: prices['ETH/USD'], decimals: 8 },
    { asset: "SOL/USD", price: prices['SOL/USD'], decimals: 8 },
  ];

  console.log('\nUpdating on-chain prices:');
  for (const u of updates) {
    const priceUsd = (u.price / 1e8).toFixed(2);
    console.log(`  ${u.asset}: $${priceUsd}`);

    const tx = await oracle.updatePrice(u.asset, u.price, u.decimals);
    console.log(`  TX: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✅ Confirmed`);
  }

  console.log("\n✅ All prices updated successfully!");
}

main().catch(console.error);
