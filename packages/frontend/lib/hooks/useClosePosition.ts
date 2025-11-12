"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { POSITION_MANAGER_ABI } from "@/lib/contracts/abis";
import { CONTRACTS } from "@/lib/config/contracts";
import { useState } from "react";

/**
 * Hook to close a position
 * Handles the transaction and provides loading/success/error states
 */
export function useClosePosition() {
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const closePosition = async (positionId: number) => {
    try {
      setIsClosing(true);
      setCloseError(null);

      writeContract({
        address: CONTRACTS.POSITION_MANAGER,
        abi: POSITION_MANAGER_ABI,
        functionName: "closePosition",
        args: [BigInt(positionId)],
      });
    } catch (err: any) {
      console.error("Error closing position:", err);
      setCloseError(err.message || "Failed to close position");
      setIsClosing(false);
    }
  };

  // Update isClosing state based on transaction status
  React.useEffect(() => {
    if (isSuccess) {
      setIsClosing(false);
    }
    if (writeError || receiptError) {
      setCloseError(
        (writeError?.message || receiptError?.message || "Transaction failed")
      );
      setIsClosing(false);
    }
  }, [isSuccess, writeError, receiptError]);

  return {
    closePosition,
    isClosing: isClosing || isWritePending || isConfirming,
    isSuccess,
    error: closeError,
    txHash: hash,
  };
}

import React from "react";
