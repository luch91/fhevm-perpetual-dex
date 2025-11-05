import { defineChain } from 'viem';

export const zamaDevnet = defineChain({
  id: 8009,
  name: 'Zama Devnet',
  network: 'zama-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZAMA',
    symbol: 'ZAMA',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.zama.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.zama.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Zama Explorer',
      url: 'https://explorer.zama.ai',
    },
  },
  testnet: true,
});

export const supportedChains = [zamaDevnet] as const;
