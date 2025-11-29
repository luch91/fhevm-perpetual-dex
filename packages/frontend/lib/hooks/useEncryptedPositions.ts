'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useFhevm } from './useFhevm';
import { getOrCreateKeypair, FhevmKeypair } from '../fhevm/keypair';
import { CONTRACTS } from '@/lib/config/contracts';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';

interface DecryptedPosition {
  id: number;
  size: bigint | null;       // Decrypted size (null if pending/failed)
  collateral: bigint | null; // Decrypted collateral (null if pending/failed)
  entryPrice: bigint;
  leverage: bigint;
  timestamp: bigint;
  isLong: boolean;
  isOpen: boolean;
  decryptionStatus: 'pending' | 'decrypted' | 'failed';
}

interface UseEncryptedPositionsReturn {
  positions: DecryptedPosition[];
  isLoading: boolean;
  error: string | null;
  fetchPositions: () => Promise<void>;
  decryptPosition: (positionId: number) => Promise<void>;
  decryptAllPositions: () => Promise<void>;
  fhevmReady: boolean;
  keypair: FhevmKeypair | null;
  hasKeypair: boolean;
}

/**
 * Hook for fetching and decrypting FHE-encrypted positions
 * Uses the fhEVM gateway for decryption requests
 */
export function useEncryptedPositions(): UseEncryptedPositionsReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { instance, isInitialized: fhevmReady, requestDecryption } = useFhevm();

  const [positions, setPositions] = useState<DecryptedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keypair, setKeypair] = useState<FhevmKeypair | null>(null);

  // Initialize user keypair on connection
  useEffect(() => {
    async function initKeypair() {
      if (!isConnected) return;

      try {
        const kp = await getOrCreateKeypair();
        setKeypair(kp);
        console.log('FHE keypair initialized for user');
      } catch (err: any) {
        console.error('Failed to initialize keypair:', err);
        setError('Failed to initialize encryption keypair');
      }
    }

    initKeypair();
  }, [isConnected]);

  // Fetch positions (encrypted handles only)
  const fetchPositions = useCallback(async () => {
    if (!address || !publicClient || !CONTRACTS.POSITION_MANAGER) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get position count for trader
      const count = await publicClient.readContract({
        address: CONTRACTS.POSITION_MANAGER,
        abi: POSITION_MANAGER_ABI,
        functionName: 'getPositionCount',
        args: [address],
      }) as bigint;

      // Get position IDs for this trader
      const positionIds = await publicClient.readContract({
        address: CONTRACTS.POSITION_MANAGER,
        abi: POSITION_MANAGER_ABI,
        functionName: 'getTraderPositions',
        args: [address],
      }) as bigint[];

      // Fetch each position
      const fetchedPositions: DecryptedPosition[] = [];

      for (const positionId of positionIds) {
        try {
          const position = await publicClient.readContract({
            address: CONTRACTS.POSITION_MANAGER,
            abi: POSITION_MANAGER_ABI,
            functionName: 'getPosition',
            args: [positionId],
          }) as any;

          fetchedPositions.push({
            id: Number(positionId),
            size: null,              // Encrypted - will decrypt separately
            collateral: null,        // Encrypted - will decrypt separately
            entryPrice: position.entryPrice,
            leverage: position.leverage,
            timestamp: position.timestamp,
            isLong: position.isLong,
            isOpen: position.isOpen,
            decryptionStatus: 'pending',
          });
        } catch (err) {
          console.warn(`Failed to fetch position ${positionId}:`, err);
        }
      }

      setPositions(fetchedPositions);
    } catch (err: any) {
      console.error('Failed to fetch positions:', err);
      setError(err.message || 'Failed to fetch positions');
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  // Decrypt a single position's encrypted fields
  const decryptPosition = useCallback(async (positionId: number) => {
    if (!fhevmReady || !requestDecryption || !address) {
      console.warn('fhEVM not ready for decryption');
      return;
    }

    // Find the position
    const positionIndex = positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    try {
      // Get encrypted handles from contract
      const [encryptedSize, encryptedCollateral] = await Promise.all([
        publicClient?.readContract({
          address: CONTRACTS.POSITION_MANAGER,
          abi: POSITION_MANAGER_ABI,
          functionName: 'getEncryptedSize',
          args: [BigInt(positionId)],
        }),
        publicClient?.readContract({
          address: CONTRACTS.POSITION_MANAGER,
          abi: POSITION_MANAGER_ABI,
          functionName: 'getEncryptedCollateral',
          args: [BigInt(positionId)],
        }),
      ]);

      // Request decryption from gateway
      const [decryptedSize, decryptedCollateral] = await Promise.all([
        requestDecryption(encryptedSize as bigint, CONTRACTS.POSITION_MANAGER),
        requestDecryption(encryptedCollateral as bigint, CONTRACTS.POSITION_MANAGER),
      ]);

      // Update position with decrypted values
      setPositions(prev => prev.map((p, i) =>
        i === positionIndex
          ? {
              ...p,
              size: decryptedSize,
              collateral: decryptedCollateral,
              decryptionStatus: 'decrypted' as const,
            }
          : p
      ));
    } catch (err: any) {
      console.error(`Failed to decrypt position ${positionId}:`, err);
      setPositions(prev => prev.map((p, i) =>
        i === positionIndex
          ? { ...p, decryptionStatus: 'failed' as const }
          : p
      ));
    }
  }, [fhevmReady, requestDecryption, positions, publicClient, address]);

  // Decrypt all open positions
  const decryptAllPositions = useCallback(async () => {
    const openPositions = positions.filter(
      p => p.isOpen && p.decryptionStatus === 'pending'
    );

    console.log(`Decrypting ${openPositions.length} positions...`);

    for (const position of openPositions) {
      await decryptPosition(position.id);
    }
  }, [positions, decryptPosition]);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    decryptPosition,
    decryptAllPositions,
    fhevmReady,
    keypair,
    hasKeypair: keypair !== null,
  };
}

export default useEncryptedPositions;
