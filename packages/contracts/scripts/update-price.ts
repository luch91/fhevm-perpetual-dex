// scripts/update-price.ts
import { ethers } from "hardhat";

async function main() {
  const oracleAddress = "0xd873836f1DC9A077E46Ab67A589A6FC2575c9A10";

  const oracle = await ethers.getContractAt("PriceOracle", oracleAddress);

  const updates = [
    { asset: "BTC/USD", price: 47000e8, decimals: 8 },
    { asset: "ETH/USD", price: 3400e8,  decimals: 8 },
    { asset: "SOL/USD", price: 150e8,   decimals: 8 },
  ];

  for (const u of updates) {
    console.log(`Updating ${u.asset} → ${u.price}`);
    const tx = await oracle.updatePrice(u.asset, u.price, u.decimals);
    console.log("TX:", tx.hash);
    await tx.wait();
  }

  console.log("✅ All prices updated!");
}

main().catch(console.error);
