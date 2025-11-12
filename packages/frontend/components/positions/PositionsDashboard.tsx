"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useClosePosition } from "@/lib/hooks/useClosePosition";
import { CONTRACTS } from "@/lib/config/contracts";

interface Position {
  id: number;
  side: "long" | "short";
  size: string;
  collateral: string;
  entryPrice: number;
  leverage: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  liquidationPrice: number;
  isOpen: boolean;
}

// Mock positions for demonstration
const mockPositions: Position[] = [
  {
    id: 0,
    side: "long",
    size: "Encrypted",
    collateral: "Encrypted",
    entryPrice: 44500,
    leverage: 5,
    currentPrice: 45000,
    pnl: 112.36,
    pnlPercentage: 2.24,
    liquidationPrice: 42750,
    isOpen: true,
  },
];

export default function PositionsDashboard() {
  const { isConnected, address } = useAccount();
  const [positions] = useState<Position[]>(mockPositions);
  const { closePosition, isClosing, isSuccess, error: closeError, txHash } = useClosePosition();
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);

  const handleClosePosition = async (positionId: number) => {
    if (!CONTRACTS.POSITION_MANAGER) {
      alert("Contracts not deployed yet. This will work once contracts are deployed to Sepolia testnet.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to close position #${positionId}? This action cannot be undone.`
    );

    if (confirmed) {
      setClosingPositionId(positionId);
      await closePosition(positionId);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <div className="text-gray-400 text-lg">
          Connect your wallet to view positions
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <div className="text-gray-400 text-lg">No open positions</div>
        <div className="text-gray-500 text-sm mt-2">
          Open a position to get started
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => (
        <div
          key={position.id}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  position.side === "long"
                    ? "bg-green-900/50 text-green-400"
                    : "bg-red-900/50 text-red-400"
                }`}
              >
                {position.side.toUpperCase()} {position.leverage}x
              </span>
              <span className="text-gray-400">Position #{position.id}</span>
            </div>
            <button
              onClick={() => handleClosePosition(position.id)}
              disabled={isClosing && closingPositionId === position.id}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isClosing && closingPositionId === position.id
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isClosing && closingPositionId === position.id
                ? "Closing..."
                : "Close Position"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Size</div>
              <div className="text-white font-medium flex items-center space-x-2">
                <span>{position.size}</span>
                <span className="text-xs text-gray-500">🔒</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Collateral</div>
              <div className="text-white font-medium flex items-center space-x-2">
                <span>{position.collateral}</span>
                <span className="text-xs text-gray-500">🔒</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Entry Price</div>
              <div className="text-white font-medium">
                ${position.entryPrice.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Current Price</div>
              <div className="text-white font-medium">
                ${position.currentPrice.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div>
              <div className="text-sm text-gray-400 mb-1">Unrealized PnL</div>
              <div
                className={`font-semibold ${
                  position.pnl >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)} (
                {position.pnlPercentage >= 0 ? "+" : ""}
                {position.pnlPercentage.toFixed(2)}%)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Liquidation Price</div>
              <div className="text-red-400 font-medium">
                ${position.liquidationPrice.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-500 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>🔒</span>
              <span>
                Size and collateral are encrypted. Only you can decrypt these values.
              </span>
            </div>
          </div>

          {/* Success/Error Messages */}
          {isSuccess && closingPositionId === position.id && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-800 rounded-lg">
              <div className="text-sm text-green-200">
                Position closed successfully! TX: {txHash?.slice(0, 10)}...
              </div>
            </div>
          )}
          {closeError && closingPositionId === position.id && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-lg">
              <div className="text-sm text-red-200">{closeError}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
