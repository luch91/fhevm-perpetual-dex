export const CONTRACT_ADDRESSES = {
  8009: {
    // Zama Devnet (deprecated - v0.5)
    positionManager: '',
    perpetualDEX: '',
    priceOracle: '',
  },
  11155111: {
    // Sepolia Testnet with fhEVM v0.9
    positionManager: process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '',
    perpetualDEX: process.env.NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS || '',
    priceOracle: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '',
  },
} as const;

export function getContractAddress(
  chainId: number,
  contractName: 'positionManager' | 'perpetualDEX' | 'priceOracle'
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
