// Contract ABIs will be generated from Hardhat compilation
// For now, we'll define the essential function signatures

export const POSITION_MANAGER_ABI = [
  {
    inputs: [
      { internalType: 'uint64', name: 'size', type: 'uint64' },
      { internalType: 'uint64', name: 'collateral', type: 'uint64' },
      { internalType: 'bool', name: 'isLong', type: 'bool' },
      { internalType: 'uint256', name: 'leverage', type: 'uint256' },
    ],
    name: 'openPosition',
    outputs: [{ internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    name: 'closePosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    name: 'getPosition',
    outputs: [
      {
        components: [
          { internalType: 'euint64', name: 'size', type: 'uint256' },
          { internalType: 'euint64', name: 'collateral', type: 'uint256' },
          { internalType: 'uint256', name: 'entryPrice', type: 'uint256' },
          { internalType: 'uint256', name: 'leverage', type: 'uint256' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'isLong', type: 'bool' },
          { internalType: 'bool', name: 'isOpen', type: 'bool' },
        ],
        internalType: 'struct IPositionManager.Position',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'trader', type: 'address' }],
    name: 'getTraderPositions',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    name: 'getEncryptedSize',
    outputs: [{ internalType: 'euint64', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'positionId', type: 'uint256' }],
    name: 'getEncryptedCollateral',
    outputs: [{ internalType: 'euint64', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'trader', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'positionId', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'isLong', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'entryPrice', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'PositionOpened',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'trader', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'positionId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'exitPrice', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'PositionClosed',
    type: 'event',
  },
] as const;

export const PERPETUAL_DEX_ABI = [
  {
    inputs: [],
    name: 'positionManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isPaused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const PRICE_ORACLE_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'asset', type: 'string' }],
    name: 'getPrice',
    outputs: [
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint8', name: 'decimals', type: 'uint8' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'asset', type: 'string' }],
    name: 'isPriceFresh',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'asset', type: 'string' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint8', name: 'decimals', type: 'uint8' },
    ],
    name: 'updatePrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
