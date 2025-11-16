import { ethers } from 'ethers';

// Type definitions for fhevmjs
type FhevmInstance = any;

let fhevmInstance: FhevmInstance | null = null;
let fhevmModule: any = null;

// Dynamically load fhevmjs module (client-side only)
async function loadFhevmModule() {
  if (fhevmModule) {
    return fhevmModule;
  }

  // Only load on client side
  if (typeof window === 'undefined') {
    throw new Error('fhEVM can only be initialized on the client side');
  }

  try {
    // Dynamic import to avoid SSR issues
    fhevmModule = await import('fhevmjs');
    return fhevmModule;
  } catch (error) {
    console.error('Failed to load fhevmjs module:', error);
    throw new Error('Failed to load fhEVM library');
  }
}

export async function initFhevm(provider: ethers.BrowserProvider): Promise<FhevmInstance> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    console.log('Initializing fhEVM instance with v0.3.2 SDK (v0.8 compatible)...');

    // Load the module first
    const fhevm = await loadFhevmModule();

    // Initialize TFHE WASM bindings first (required for v0.3.2)
    console.log('Loading TFHE WASM bindings...');
    await fhevm.initFhevm();

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    console.log(`Chain ID: ${chainId}`);

    // Create fhEVM instance using v0.3.2 API
    // Environment variables are required - no fallback for security
    if (!process.env.NEXT_PUBLIC_RPC_URL) {
      throw new Error('NEXT_PUBLIC_RPC_URL environment variable is required');
    }
    if (!process.env.NEXT_PUBLIC_GATEWAY_URL) {
      throw new Error('NEXT_PUBLIC_GATEWAY_URL environment variable is required');
    }

    fhevmInstance = await fhevm.createInstance({
      chainId,
      networkUrl: process.env.NEXT_PUBLIC_RPC_URL,
      gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
    });

    console.log('fhEVM instance initialized successfully');
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize fhEVM:', error);
    fhevmInstance = null;
    throw new Error('Failed to initialize fhEVM instance');
  }
}

export function getFhevmInstance(): FhevmInstance {
  if (!fhevmInstance) {
    throw new Error('fhEVM instance not initialized. Call initFhevm first.');
  }
  return fhevmInstance;
}

/**
 * @deprecated Currently unused - kept for future fhEVM v0.9 migration
 * Encrypts a value using FHE for client-side encryption
 * Will be used when migrating from plaintext inputs to client-side encryption
 */
export async function encryptValue(value: number | bigint, userAddress?: string): Promise<{
  data: Uint8Array;
  signature: string;
}> {
  const instance = getFhevmInstance();

  try {
    // Create encrypted input for the contract
    const contractAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '';

    const input = instance.createEncryptedInput(contractAddress, userAddress || '');

    // Add 64-bit unsigned integer
    input.add64(BigInt(value));

    // Encrypt and generate proof
    const encryptedInput = await input.encrypt();

    return {
      data: encryptedInput.handles[0],
      signature: encryptedInput.inputProof,
    };
  } catch (error) {
    console.error('Failed to encrypt value:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * @deprecated Currently unused - kept for future fhEVM v0.9 migration
 * Decrypts an encrypted value from the blockchain
 * Will be used to display encrypted position sizes and collateral amounts
 */
export async function decryptValue(
  handle: bigint,
  contractAddress: string,
  userAddress: string
): Promise<bigint> {
  const instance = getFhevmInstance();

  try {
    // Request decryption from gateway
    const decrypted = await instance.reencrypt(
      handle,
      contractAddress,
      userAddress
    );

    return BigInt(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt value');
  }
}
