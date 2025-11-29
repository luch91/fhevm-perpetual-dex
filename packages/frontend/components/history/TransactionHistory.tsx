'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';
import { CONTRACTS } from '@/lib/config/contracts';

interface HistoricalPosition {
  id: number;
  size: bigint;
  collateral: bigint;
  entryPrice: bigint;
  exitPrice?: bigint;
  leverage: bigint;
  timestamp: bigint;
  closeTimestamp?: bigint;
  isLong: boolean;
  isOpen: boolean;
  pnl?: number;
  pnlPercent?: number;
}

type FilterType = 'all' | 'open' | 'closed';
type SideFilter = 'all' | 'long' | 'short';
type SortField = 'date' | 'pnl' | 'size';
type SortDirection = 'asc' | 'desc';

export default function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<HistoricalPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      fetchHistory();
    }
  }, [address, isConnected]);

  async function fetchHistory() {
    if (!address || !CONTRACTS.POSITION_MANAGER) return;
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        provider
      );

      const count = await contract.getPositionCount(address);
      const fetchedPositions: HistoricalPosition[] = [];

      // Fetch all positions
      for (let i = 0; i < Math.min(Number(count), 100); i++) {
        try {
          const position = await contract.getPosition(i);

          // Calculate PnL for closed positions
          let pnl: number | undefined;
          let pnlPercent: number | undefined;

          if (!position.isOpen && position.exitPrice) {
            const entryPriceNum = Number(position.entryPrice) / 1e8;
            const exitPriceNum = Number(position.exitPrice) / 1e8;
            const collateralNum = Number(position.collateral) / 1e6;
            const leverageNum = Number(position.leverage);

            const priceChange = ((exitPriceNum - entryPriceNum) / entryPriceNum) * 100;
            pnlPercent = position.isLong ? priceChange : -priceChange;
            const leveragedPnL = pnlPercent * leverageNum;
            pnl = (collateralNum * leveragedPnL) / 100;
          }

          fetchedPositions.push({
            id: i,
            size: position.size,
            collateral: position.collateral,
            entryPrice: position.entryPrice,
            exitPrice: position.exitPrice,
            leverage: position.leverage,
            timestamp: position.timestamp,
            closeTimestamp: position.closeTimestamp,
            isLong: position.isLong,
            isOpen: position.isOpen,
            pnl,
            pnlPercent,
          });
        } catch (err) {
          console.log(`Position ${i} not accessible`);
        }
      }

      setPositions(fetchedPositions);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  // Apply filters
  const filteredPositions = positions.filter(p => {
    // Status filter
    if (statusFilter === 'open' && !p.isOpen) return false;
    if (statusFilter === 'closed' && p.isOpen) return false;

    // Side filter
    if (sideFilter === 'long' && !p.isLong) return false;
    if (sideFilter === 'short' && p.isLong) return false;

    // Search filter
    if (searchQuery && !p.id.toString().includes(searchQuery)) {
      return false;
    }

    return true;
  });

  // Apply sorting
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'date') {
      comparison = Number(a.timestamp) - Number(b.timestamp);
    } else if (sortField === 'pnl') {
      const pnlA = a.pnl || 0;
      const pnlB = b.pnl || 0;
      comparison = pnlA - pnlB;
    } else if (sortField === 'size') {
      comparison = Number(a.size) - Number(b.size);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Position ID', 'Date', 'Side', 'Entry Price', 'Exit Price', 'Size', 'Collateral', 'Leverage', 'PnL', 'Status'];
    const rows = sortedPositions.map(p => [
      p.id,
      new Date(Number(p.timestamp) * 1000).toLocaleDateString(),
      p.isLong ? 'LONG' : 'SHORT',
      (Number(p.entryPrice) / 1e8).toFixed(2),
      p.exitPrice ? (Number(p.exitPrice) / 1e8).toFixed(2) : '-',
      p.size.toString(),
      (Number(p.collateral) / 1e6).toFixed(2),
      p.leverage.toString(),
      p.pnl?.toFixed(2) || '-',
      p.isOpen ? 'OPEN' : 'CLOSED',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `position-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold">Transaction History</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-4 py-2 min-h-[44px] bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:bg-gray-700 rounded font-semibold transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={sortedPositions.length === 0}
            className="px-4 py-2 min-h-[44px] bg-gray-700 hover:bg-gray-600 active:bg-gray-500 disabled:bg-gray-800 rounded font-semibold transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4 md:mb-6">
        {/* Status filter */}
        <div className="flex gap-2">
          {(['all', 'open', 'closed'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] rounded font-semibold text-sm md:text-base transition-colors ${
                statusFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Side filter */}
        <div className="flex gap-2">
          {(['all', 'long', 'short'] as SideFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setSideFilter(filter)}
              className={`flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] rounded font-semibold text-sm md:text-base transition-colors ${
                sideFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by Position ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 min-h-[44px] bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading history...</div>
      ) : sortedPositions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No positions found</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="text-left py-3 px-2">ID</th>
                  <th
                    className="text-left py-3 px-2 cursor-pointer hover:text-white"
                    onClick={() => handleSort('date')}
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-2">Side</th>
                  <th className="text-right py-3 px-2">Entry Price</th>
                  <th className="text-right py-3 px-2">Exit Price</th>
                  <th
                    className="text-right py-3 px-2 cursor-pointer hover:text-white"
                    onClick={() => handleSort('size')}
                  >
                    Size {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-3 px-2">Collateral</th>
                  <th className="text-center py-3 px-2">Leverage</th>
                  <th
                    className="text-right py-3 px-2 cursor-pointer hover:text-white"
                    onClick={() => handleSort('pnl')}
                  >
                    PnL {sortField === 'pnl' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => (
                  <tr key={position.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-2">#{position.id}</td>
                    <td className="py-3 px-2 text-gray-400">
                      {new Date(Number(position.timestamp) * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.isLong ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
                      }`}>
                        {position.isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${(Number(position.entryPrice) / 1e8).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-400">
                      {position.exitPrice ? `$${(Number(position.exitPrice) / 1e8).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">{position.size.toString()}</td>
                    <td className="py-3 px-2 text-right">
                      ${(Number(position.collateral) / 1e6).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">{position.leverage.toString()}x</td>
                    <td className="py-3 px-2 text-right">
                      {position.pnl !== undefined ? (
                        <span className={position.pnl >= 0 ? 'text-long' : 'text-short'}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {position.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sortedPositions.map((position) => (
              <div key={position.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.isLong ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
                      }`}>
                        {position.isLong ? 'LONG' : 'SHORT'} {position.leverage.toString()}x
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {position.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Position #{position.id}</div>
                  </div>
                  {position.pnl !== undefined && (
                    <div className={`text-lg font-bold ${position.pnl >= 0 ? 'text-long' : 'text-short'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Entry Price</div>
                    <div className="font-semibold">${(Number(position.entryPrice) / 1e8).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Exit Price</div>
                    <div className="font-semibold">
                      {position.exitPrice ? `$${(Number(position.exitPrice) / 1e8).toLocaleString()}` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Collateral</div>
                    <div className="font-semibold">${(Number(position.collateral) / 1e6).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Date</div>
                    <div className="font-semibold text-xs">
                      {new Date(Number(position.timestamp) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-gray-400 text-xs md:text-sm">Total Positions</div>
              <div className="text-xl md:text-2xl font-bold">{positions.length}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs md:text-sm">Open</div>
              <div className="text-xl md:text-2xl font-bold text-green-400">
                {positions.filter(p => p.isOpen).length}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs md:text-sm">Closed</div>
              <div className="text-xl md:text-2xl font-bold text-gray-400">
                {positions.filter(p => !p.isOpen).length}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs md:text-sm">Total PnL</div>
              <div className={`text-xl md:text-2xl font-bold ${
                positions.reduce((sum, p) => sum + (p.pnl || 0), 0) >= 0 ? 'text-long' : 'text-short'
              }`}>
                ${positions.reduce((sum, p) => sum + (p.pnl || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
