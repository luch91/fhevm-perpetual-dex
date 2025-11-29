'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Types for fhevmjs
interface FhevmInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInput;
  reencrypt: (handle: bigint, privateKey: string, publicKey: string) => Promise<bigint>;
  generateKeypair: () => { publicKey: string; privateKey: string };
  getPublicKey: (contractAddress: string, userAddress: string) => Promise<string>;
}

interface EncryptedInput {
  add64: (value: bigint) => EncryptedInput;
  add32: (value: number) => EncryptedInput;
  addBool: (value: boolean) => EncryptedInput;
  encrypt: () => Promise<{ handles: Uint8Array[]; inputProof: string }>;
}

interface UseFhevmReturn {
  instance: FhevmInstance | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  encryptUint64: (value: bigint, contractAddress: string) => Promise<{ data: Uint8Array; proof: string } | null>;
  requestDecryption: (handle: bigint, contractAddress: string) => Promise<bigint | null>;
}

let globalFhevmInstance: FhevmInstance | null = null;
let fhevmModule: any = null;

async function loadFhevmModule() {
  if (fhevmModule) return fhevmModule;

  if (typeof window === 'undefined') {
    throw new Error('fhEVM can only be initialized on client side');
  }

  fhevmModule = await import('fhevmjs');
  return fhevmModule;
}

export function useFhevm(): UseFhevmReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fhEVM instance
  useEffect(() => {
    async function initialize() {
      if (!isConnected || !publicClient || globalFhevmInstance) {
        if (globalFhevmInstance) {
          setInstance(globalFhevmInstance);
          setIsInitialized(true);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fhevm = await loadFhevmModule();

        // Initialize TFHE WASM bindings
        await fhevm.initFhevm();

        const chainId = await publicClient.getChainId();

        if (!process.env.NEXT_PUBLIC_RPC_URL || !process.env.NEXT_PUBLIC_GATEWAY_URL) {
          throw new Error('RPC_URL and GATEWAY_URL environment variables required');
        }

        globalFhevmInstance = await fhevm.createInstance({
          chainId,
          networkUrl: process.env.NEXT_PUBLIC_RPC_URL,
          gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
        });

        setInstance(globalFhevmInstance);
        setIsInitialized(true);
      } catch (err: any) {
        console.error('fhEVM initialization failed:', err);
        setError(err.message || 'Failed to initialize fhEVM');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [isConnected, publicClient]);

  // Encrypt a uint64 value
  const encryptUint64 = useCallback(async (
    value: bigint,
    contractAddress: string
  ): Promise<{ data: Uint8Array; proof: string } | null> => {
    if (!instance || !address) {
      console.warn('fhEVM not initialized or wallet not connected');
      return null;
    }

    try {
      const input = instance.createEncryptedInput(contractAddress, address);
      input.add64(value);

      const encrypted = await input.encrypt();

      return {
        data: encrypted.handles[0],
        proof: encrypted.inputProof,
      };
    } catch (err: any) {
      console.error('Encryption failed:', err);
      setError(err.message || 'Encryption failed');
      return null;
    }
  }, [instance, address]);

  // Request decryption via gateway
  const requestDecryption = useCallback(async (
    handle: bigint,
    contractAddress: string
  ): Promise<bigint | null> => {
    if (!instance || !address || !walletClient) {
      console.warn('fhEVM not initialized or wallet not connected');
      return null;
    }

    try {
      // Generate ephemeral keypair for reencryption
      const { publicKey, privateKey } = instance.generateKeypair();

      // Get the public key from the contract
      const contractPublicKey = await instance.getPublicKey(contractAddress, address);

      // Request reencryption from gateway
      const decrypted = await instance.reencrypt(
        handle,
        privateKey,
        contractPublicKey
      );

      return decrypted;
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setError(err.message || 'Decryption failed');
      return null;
    }
  }, [instance, address, walletClient]);

  return {
    instance,
    isInitialized,
    isLoading,
    error,
    encryptUint64,
    requestDecryption,
  };
}

export default useFhevm;
