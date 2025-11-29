'use client';

import { useAccount } from 'wagmi';
import PositionsList from '@/components/positions/PositionsList';
import PositionHistory from '@/components/positions/PositionHistory';

export default function PositionsPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg">Please connect your wallet to view positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Positions</h1>

      {/* Active Positions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
        <PositionsList />
      </div>

      {/* Position History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Position History</h2>
        <PositionHistory />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-sm text-blue-200">
          <strong>Privacy Note:</strong> Your position sizes and collateral are encrypted on-chain. Position data will be fetched and decrypted using fhevmjs.
        </p>
      </div>
    </div>
  );
}
