'use client';

import { useAccount } from 'wagmi';
import { usePositionHistory } from '@/lib/hooks/usePositionHistory';

export default function PositionHistory() {
  const { address } = useAccount();
  const { history, stats, isLoading, error } = usePositionHistory(address);

  if (!address) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <p className="text-gray-400 text-center">
          Connect wallet to view position history
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <p className="text-gray-400 text-center">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <p className="text-red-400 text-center">
          Error loading history: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Positions</p>
          <p className="text-white text-2xl font-bold">{stats.totalPositions}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Open</p>
          <p className="text-blue-400 text-2xl font-bold">
            {stats.openPositions}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Closed</p>
          <p className="text-gray-400 text-2xl font-bold">
            {stats.closedPositions}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p
            className={`text-2xl font-bold ${
              stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {stats.winRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Exit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PnL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No trading history
                  </td>
                </tr>
              ) : (
                history.map((position) => (
                  <tr
                    key={position.positionId}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      #{position.positionId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          position.isLong
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-red-900/20 text-red-400'
                        }`}
                      >
                        {position.isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      ${(Number(position.entryPrice) / 1e8).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {position.exitPrice
                        ? `$${(Number(position.exitPrice) / 1e8).toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {position.pnl !== null ? (
                        <span
                          className={
                            position.pnl > 0n
                              ? 'text-green-400'
                              : position.pnl < 0n
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }
                        >
                          {position.pnl > 0n ? '+' : ''}
                          {(Number(position.pnl) / 1e8).toLocaleString()} USDC
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          position.status === 'open'
                            ? 'bg-blue-900/20 text-blue-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {position.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(position.openTimestamp * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
