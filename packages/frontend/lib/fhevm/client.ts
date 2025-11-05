import { createInstance, FhevmInstance } from 'fhevmjs';
import { ethers } from 'ethers';

let fhevmInstance: FhevmInstance | null = null;

export async function initFhevm(provider: ethers.BrowserProvider): Promise<FhevmInstance> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    console.log('Initializing fhEVM instance...');

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Create fhEVM instance
    fhevmInstance = await createInstance({
      chainId,
      networkUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.zama.ai',
      gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.zama.ai',
    });

    console.log('fhEVM instance initialized successfully');
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize fhEVM:', error);
    throw new Error('Failed to initialize fhEVM instance');
  }
}

export function getFhevmInstance(): FhevmInstance {
  if (!fhevmInstance) {
    throw new Error('fhEVM instance not initialized. Call initFhevm first.');
  }
  return fhevmInstance;
}

export async function encryptValue(value: number | bigint): Promise<{
  data: Uint8Array;
  signature: string;
}> {
  const instance = getFhevmInstance();

  // Create EIP-712 signature for the encrypted input
  const input = instance.createEncryptedInput(
    process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '',
    // User address will be added when we have wallet connection
  );

  input.add64(BigInt(value));

  const encryptedInput = await input.encrypt();

  return {
    data: encryptedInput.data,
    signature: encryptedInput.inputProof,
  };
}

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
