"use client";

import { useAccount, useReadContract } from "wagmi";
import { POSITION_MANAGER_ABI } from "@/lib/contracts/abis";
import { CONTRACTS } from "@/lib/config/contracts";

/**
 * Hook to fetch all position IDs for the connected user
 */
export function useUserPositionIds() {
  const { address } = useAccount();

  const { data: positionIds, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "getTraderPositions",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.POSITION_MANAGER,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return {
    positionIds: (positionIds as bigint[]) || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single position by ID
 */
export function usePosition(positionId: number | undefined) {
  const { data: position, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "getPosition",
    args: positionId !== undefined ? [BigInt(positionId)] : undefined,
    query: {
      enabled: positionId !== undefined && !!CONTRACTS.POSITION_MANAGER,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });

  return {
    position: position as any, // Type will be Position struct from contract
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch encrypted size for a position
 * This will be used with fhevmjs to decrypt the value
 */
export function useEncryptedPositionSize(positionId: number | undefined) {
  const { data: encryptedSize, isLoading, error } = useReadContract({
    address: CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "getEncryptedSize",
    args: positionId !== undefined ? [BigInt(positionId)] : undefined,
    query: {
      enabled: positionId !== undefined && !!CONTRACTS.POSITION_MANAGER,
    },
  });

  return {
    encryptedSize,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch encrypted collateral for a position
 * This will be used with fhevmjs to decrypt the value
 */
export function useEncryptedPositionCollateral(positionId: number | undefined) {
  const { data: encryptedCollateral, isLoading, error } = useReadContract({
    address: CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "getEncryptedCollateral",
    args: positionId !== undefined ? [BigInt(positionId)] : undefined,
    query: {
      enabled: positionId !== undefined && !!CONTRACTS.POSITION_MANAGER,
    },
  });

  return {
    encryptedCollateral,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch all positions for the connected user
 * Combines position IDs with individual position data
 */
export function useUserPositions() {
  const { positionIds, isLoading: idsLoading, error: idsError } = useUserPositionIds();

  // Note: In a production app, you'd want to use a multicall pattern
  // to fetch all positions in a single call for better performance
  // For now, this returns the position IDs and you can fetch individual
  // positions as needed

  return {
    positionIds,
    totalPositions: positionIds.length,
    isLoading: idsLoading,
    error: idsError,
  };
}
