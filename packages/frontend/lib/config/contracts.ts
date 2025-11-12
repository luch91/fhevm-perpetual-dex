// Contract addresses (will be filled after deployment)
export const CONTRACTS = {
  PRICE_ORACLE: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || "") as `0x${string}`,
  POSITION_MANAGER: (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || "") as `0x${string}`,
  PERPETUAL_DEX: (process.env.NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS || "") as `0x${string}`,
} as const;

// Chain configuration - Sepolia testnet with fhEVM coprocessor
export const CHAIN_CONFIG = {
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org",
} as const;

// Trading configuration
export const TRADING_CONFIG = {
  MIN_LEVERAGE: 1,
  MAX_LEVERAGE: 10,
  DEFAULT_LEVERAGE: 5,
  INITIAL_MARGIN_BPS: 1000, // 10%
  MAINTENANCE_MARGIN_BPS: 500, // 5%
  DEFAULT_ASSET: "BTC/USD",
  PRICE_PRECISION: 1e8, // 8 decimal places
} as const;
