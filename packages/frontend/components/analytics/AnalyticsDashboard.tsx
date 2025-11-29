'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';
import { CONTRACTS } from '@/lib/config/contracts';

interface Position {
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
}

interface Analytics {
  totalPnL: number;
  winRate: number;
  avgHoldTime: number;
  largestWin: number;
  largestLoss: number;
  totalVolume: number;
  currentOpenValue: number;
  totalPositions: number;
  profitablePositions: number;
  losingPositions: number;
  longPositions: number;
  shortPositions: number;
}

export default function AnalyticsDashboard() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchPositionsAndCalculateAnalytics();
    }
  }, [address, isConnected]);

  async function fetchPositionsAndCalculateAnalytics() {
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
      const fetchedPositions: Position[] = [];

      for (let i = 0; i < Math.min(Number(count), 100); i++) {
        try {
          const position = await contract.getPosition(i);
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
          });
        } catch (err) {
          console.log(`Position ${i} not accessible`);
        }
      }

      setPositions(fetchedPositions);

      // Calculate analytics
      const closedPositions = fetchedPositions.filter(p => !p.isOpen);
      const openPositions = fetchedPositions.filter(p => p.isOpen);

      let totalPnL = 0;
      let profitableCount = 0;
      let losingCount = 0;
      let largestWin = 0;
      let largestLoss = 0;
      let totalHoldTime = 0;
      let totalVolume = 0;

      closedPositions.forEach(p => {
        if (p.exitPrice) {
          const entryPriceNum = Number(p.entryPrice) / 1e8;
          const exitPriceNum = Number(p.exitPrice) / 1e8;
          const collateralNum = Number(p.collateral) / 1e6;
          const leverageNum = Number(p.leverage);

          const priceChange = ((exitPriceNum - entryPriceNum) / entryPriceNum) * 100;
          const pnlPercent = p.isLong ? priceChange : -priceChange;
          const leveragedPnL = pnlPercent * leverageNum;
          const pnl = (collateralNum * leveragedPnL) / 100;

          totalPnL += pnl;
          totalVolume += collateralNum * leverageNum;

          if (pnl > 0) {
            profitableCount++;
            if (pnl > largestWin) largestWin = pnl;
          } else {
            losingCount++;
            if (pnl < largestLoss) largestLoss = pnl;
          }

          if (p.closeTimestamp && p.timestamp) {
            totalHoldTime += Number(p.closeTimestamp) - Number(p.timestamp);
          }
        }
      });

      const currentOpenValue = openPositions.reduce((sum, p) => {
        const collateralNum = Number(p.collateral) / 1e6;
        return sum + collateralNum;
      }, 0);

      const winRate = closedPositions.length > 0 ? (profitableCount / closedPositions.length) * 100 : 0;
      const avgHoldTime = closedPositions.length > 0 ? totalHoldTime / closedPositions.length : 0;

      setAnalytics({
        totalPnL,
        winRate,
        avgHoldTime,
        largestWin,
        largestLoss,
        totalVolume,
        currentOpenValue,
        totalPositions: fetchedPositions.length,
        profitablePositions: profitableCount,
        losingPositions: losingCount,
        longPositions: fetchedPositions.filter(p => p.isLong).length,
        shortPositions: fetchedPositions.filter(p => !p.isLong).length,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view analytics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics || analytics.totalPositions === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No positions found. Open your first position to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total PnL */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Total PnL</div>
          <div className={`text-2xl md:text-3xl font-bold ${
            analytics.totalPnL >= 0 ? 'text-long' : 'text-short'
          }`}>
            {analytics.totalPnL >= 0 ? '+' : ''}${analytics.totalPnL.toFixed(2)}
          </div>
          <div className="text-gray-500 text-xs mt-1">All-time profit/loss</div>
        </div>

        {/* Win Rate */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Win Rate</div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            {analytics.winRate.toFixed(1)}%
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {analytics.profitablePositions} wins / {analytics.losingPositions} losses
          </div>
        </div>

        {/* Average Hold Time */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Avg Hold Time</div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            {formatDuration(analytics.avgHoldTime)}
          </div>
          <div className="text-gray-500 text-xs mt-1">Per closed position</div>
        </div>

        {/* Total Volume */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Total Volume</div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            ${analytics.totalVolume.toFixed(0)}
          </div>
          <div className="text-gray-500 text-xs mt-1">Leveraged notional</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Largest Win */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Largest Win</div>
          <div className="text-xl md:text-2xl font-bold text-long">
            +${analytics.largestWin.toFixed(2)}
          </div>
        </div>

        {/* Largest Loss */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Largest Loss</div>
          <div className="text-xl md:text-2xl font-bold text-short">
            ${analytics.largestLoss.toFixed(2)}
          </div>
        </div>

        {/* Current Open Positions Value */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Open Collateral</div>
          <div className="text-xl md:text-2xl font-bold text-white">
            ${analytics.currentOpenValue.toFixed(2)}
          </div>
        </div>

        {/* Total Positions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="text-gray-400 text-xs md:text-sm mb-1">Total Positions</div>
          <div className="text-xl md:text-2xl font-bold text-white">
            {analytics.totalPositions}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Win/Loss Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-48 h-48">
              {/* Simple pie chart visualization */}
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="20"
                  strokeDasharray={`${(analytics.losingPositions / analytics.totalPositions) * 251.2} 251.2`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="20"
                  strokeDasharray={`${(analytics.profitablePositions / analytics.totalPositions) * 251.2} 251.2`}
                  strokeDashoffset={`${-(analytics.losingPositions / analytics.totalPositions) * 251.2}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">{analytics.totalPositions}</div>
                <div className="text-xs text-gray-400">Positions</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-long"></div>
              <span className="text-sm">Wins ({analytics.profitablePositions})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-short"></div>
              <span className="text-sm">Losses ({analytics.losingPositions})</span>
            </div>
          </div>
        </div>

        {/* Long/Short Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Long/Short Distribution</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="20"
                  strokeDasharray={`${(analytics.shortPositions / analytics.totalPositions) * 251.2} 251.2`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="20"
                  strokeDasharray={`${(analytics.longPositions / analytics.totalPositions) * 251.2} 251.2`}
                  strokeDashoffset={`${-(analytics.shortPositions / analytics.totalPositions) * 251.2}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">{analytics.totalPositions}</div>
                <div className="text-xs text-gray-400">Positions</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-long"></div>
              <span className="text-sm">Long ({analytics.longPositions})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-short"></div>
              <span className="text-sm">Short ({analytics.shortPositions})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-2">Profitability</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-long h-full transition-all"
                  style={{ width: `${analytics.winRate}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{analytics.winRate.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Total Return on Collateral</div>
            <div className={`text-xl font-bold ${analytics.totalPnL >= 0 ? 'text-long' : 'text-short'}`}>
              {analytics.currentOpenValue > 0
                ? ((analytics.totalPnL / analytics.currentOpenValue) * 100).toFixed(2)
                : '0.00'}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
