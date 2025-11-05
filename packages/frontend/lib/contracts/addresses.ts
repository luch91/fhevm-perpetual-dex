export const CONTRACT_ADDRESSES = {
  8009: {
    // Zama Devnet
    positionManager: process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '',
    perpetualDEX: process.env.NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS || '',
  },
  // Add more networks as needed
} as const;

export function getContractAddress(chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[8009]) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses configured for chain ID ${chainId}`);
  }
  return addresses[contractName];
}
