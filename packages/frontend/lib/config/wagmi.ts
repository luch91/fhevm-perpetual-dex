import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";

// Configure wagmi with RainbowKit using Sepolia testnet
// fhEVM coprocessor is deployed on Sepolia for privacy-preserving smart contracts
export const config = getDefaultConfig({
  appName: "fhEVM Perpetual DEX",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia],
  ssr: true, // Enable server-side rendering
});
