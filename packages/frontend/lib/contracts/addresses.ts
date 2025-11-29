export const CONTRACT_ADDRESSES = {
  11155111: {
    // Sepolia Testnet with fhEVM coprocessor
    positionManager: process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '',
    perpetualDEX: process.env.NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS || '',
    priceOracle: process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS || '',
    mockUsdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
    fundingRateManager: process.env.NEXT_PUBLIC_FUNDING_RATE_MANAGER_ADDRESS || '',
    liquidationKeeper: process.env.NEXT_PUBLIC_LIQUIDATION_KEEPER_ADDRESS || '',
  },
} as const;

export type ContractName = 'positionManager' | 'perpetualDEX' | 'priceOracle' | 'mockUsdc' | 'fundingRateManager' | 'liquidationKeeper';

export function getContractAddress(
  chainId: number,
  contractName: ContractName
): string {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses configured for chain ID ${chainId}`);
  }
  const address = addresses[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not found for chain ID ${chainId}`);
  }
  return address;
}

// Export contract addresses for direct access
export const contractAddresses = CONTRACT_ADDRESSES[11155111];
