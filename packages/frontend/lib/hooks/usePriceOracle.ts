"use client";

import { useReadContract } from "wagmi";
import { PRICE_ORACLE_ABI } from "@/lib/contracts/abis";
import { CONTRACTS, TRADING_CONFIG } from "@/lib/config/contracts";

/**
 * Hook to fetch the current price for an asset
 * @param asset - Asset symbol (e.g., "BTC/USD")
 */
export function useAssetPrice(asset: string = TRADING_CONFIG.DEFAULT_ASSET) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: "getPrice",
    args: [asset],
    query: {
      enabled: !!CONTRACTS.PRICE_ORACLE,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time price updates
    },
  });

  // Parse the tuple response: [price, decimals, timestamp]
  const parsedData = data as [bigint, number, bigint] | undefined;

  return {
    price: parsedData ? parsedData[0] : BigInt(0),
    decimals: parsedData ? parsedData[1] : 8,
    timestamp: parsedData ? parsedData[2] : BigInt(0),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a price feed is fresh (updated within the last hour)
 * @param asset - Asset symbol
 */
export function useIsPriceFresh(asset: string = TRADING_CONFIG.DEFAULT_ASSET) {
  const { data: isFresh, isLoading, error } = useReadContract({
    address: CONTRACTS.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: "isPriceFresh",
    args: [asset],
    query: {
      enabled: !!CONTRACTS.PRICE_ORACLE,
    },
  });

  return {
    isFresh: isFresh as boolean,
    isLoading,
    error,
  };
}

/**
 * Hook to get the formatted price for display
 * Handles decimals and formatting automatically
 */
export function useFormattedPrice(asset: string = TRADING_CONFIG.DEFAULT_ASSET) {
  const { price, decimals, timestamp, isLoading, error } = useAssetPrice(asset);

  const formattedPrice = React.useMemo(() => {
    if (!price || price === BigInt(0)) return "0.00";

    const priceNumber = Number(price) / Math.pow(10, decimals);
    return priceNumber.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [price, decimals]);

  const lastUpdated = React.useMemo(() => {
    if (!timestamp || timestamp === BigInt(0)) return null;
    return new Date(Number(timestamp) * 1000);
  }, [timestamp]);

  return {
    formattedPrice,
    rawPrice: price,
    decimals,
    lastUpdated,
    isLoading,
    error,
  };
}

// Note: React import needed for useMemo
import React from "react";
