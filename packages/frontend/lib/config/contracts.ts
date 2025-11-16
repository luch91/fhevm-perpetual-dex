export const CONTRACTS = {
  POSITION_MANAGER: (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '') as `0x${string}`,
  PERPETUAL_DEX: (process.env.NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS || '') as `0x${string}`,
  PRICE_ORACLE: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '') as `0x${string}`,
  CHAINLINK_ORACLE: (process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS || '') as `0x${string}`,
};

export const TRADING_CONFIG = {
  MIN_LEVERAGE: 1,
  MAX_LEVERAGE: 10,
  INITIAL_MARGIN_BPS: 500,        // 5%
  MAINTENANCE_MARGIN_BPS: 250,     // 2.5%
  DEFAULT_ASSET: 'BTC/USD' as const,
  PRICE_PRECISION: 1e8,            // 8 decimals
};
