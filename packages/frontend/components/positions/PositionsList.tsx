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
  leverage: bigint;
  timestamp: bigint;
  isLong: boolean;
  isOpen: boolean;
}

interface PositionCardProps {
  position: Position;
  currentPrice: number;
  onClose: (positionId: number) => void;
}

function PositionCard({ position, currentPrice, onClose }: PositionCardProps) {
  const { id, entryPrice, leverage, isLong, isOpen } = position;

  // Calculate PnL percentage
  const entryPriceNum = Number(entryPrice) / 1e8;
  const priceChange = ((currentPrice - entryPriceNum) / entryPriceNum) * 100;
  const pnlPercent = isLong ? priceChange : -priceChange;
  const leveragedPnL = pnlPercent * Number(leverage);

  // Calculate liquidation price (simplified)
  const maintenanceMargin = 5; // 5%
  const liquidationPricePercent = (100 - maintenanceMargin) / Number(leverage);
  const liquidationPrice = isLong
    ? entryPriceNum * (1 - liquidationPricePercent / 100)
    : entryPriceNum * (1 + liquidationPricePercent / 100);

  const isNearLiquidation = isLong
    ? currentPrice < liquidationPrice * 1.1
    : currentPrice > liquidationPrice * 0.9;

  return (
    <div className={`bg-gray-800 border ${isNearLiquidation ? 'border-red-500' : 'border-gray-700'} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              isLong ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
            }`}>
              {isLong ? 'LONG' : 'SHORT'} {leverage}x
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              isOpen ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Position #{id}</div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold ${leveragedPnL >= 0 ? 'text-long' : 'text-short'}`}>
            {leveragedPnL >= 0 ? '+' : ''}{leveragedPnL.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% unleveraged
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <div className="text-gray-400 text-xs">Entry Price</div>
          <div className="font-semibold">${entryPriceNum.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Current Price</div>
          <div className="font-semibold">${currentPrice.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Liquidation Price</div>
          <div className={`font-semibold ${isNearLiquidation ? 'text-red-400' : ''}`}>
            ${liquidationPrice.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Opened</div>
          <div className="font-semibold">
            {new Date(Number(position.timestamp) * 1000).toLocaleDateString()}
          </div>
        </div>
      </div>

      {isNearLiquidation && isOpen && (
        <div className="bg-red-500/10 border border-red-500/50 rounded p-2 mb-3">
          <div className="text-red-400 text-xs font-semibold">⚠️ Near Liquidation</div>
          <div className="text-red-300 text-xs">
            Position will be liquidated at ${liquidationPrice.toFixed(2)}
          </div>
        </div>
      )}

      {isOpen && (
        <button
          onClick={() => onClose(id)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold transition-colors"
        >
          Close Position
        </button>
      )}
    </div>
  );
}

export default function PositionsList() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(97234); // BTC price
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');

  useEffect(() => {
    if (isConnected && address) {
      fetchPositions();
      // Fetch current price
      fetchCurrentPrice();
    }
  }, [address, isConnected]);

  async function fetchCurrentPrice() {
    try {
      // Fetch from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const data = await response.json();
      setCurrentPrice(data.bitcoin.usd);
    } catch (error) {
      console.error('Failed to fetch current price:', error);
    }
  }

  async function fetchPositions() {
    if (!address) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        provider
      );

      // Get position count for this trader
      const count = await contract.getPositionCount(address);
      console.log('Position count:', count.toString());

      // Fetch all positions (this is simplified - in production, use events)
      const fetchedPositions: Position[] = [];

      // For now, try to fetch first 10 positions
      for (let i = 0; i < Math.min(Number(count), 10); i++) {
        try {
          const position = await contract.getPosition(i);
          fetchedPositions.push({
            id: i,
            size: position.size,
            collateral: position.collateral,
            entryPrice: position.entryPrice,
            leverage: position.leverage,
            timestamp: position.timestamp,
            isLong: position.isLong,
            isOpen: position.isOpen,
          });
        } catch (err) {
          console.log(`Position ${i} not accessible or doesn't exist`);
        }
      }

      setPositions(fetchedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClosePosition(positionId: number) {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        signer
      );

      console.log(`Closing position ${positionId}...`);
      const tx = await contract.closePosition(positionId);
      console.log('Transaction sent:', tx.hash);

      await tx.wait();
      console.log('Position closed!');

      // Refresh positions
      await fetchPositions();
    } catch (error: any) {
      console.error('Error closing position:', error);
      alert(error.message || 'Failed to close position');
    }
  }

  const filteredPositions = positions.filter(p => {
    if (filter === 'open') return p.isOpen;
    if (filter === 'closed') return !p.isOpen;
    return true;
  });

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view positions</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Positions</h2>
        <button
          onClick={fetchPositions}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 rounded font-semibold transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Positions grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading positions...</div>
      ) : filteredPositions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No {filter === 'all' ? '' : filter} positions found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              currentPrice={currentPrice}
              onClose={handleClosePosition}
            />
          ))}
        </div>
      )}

      {/* Summary stats */}
      {positions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Total Positions</div>
            <div className="text-2xl font-bold">{positions.length}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Open Positions</div>
            <div className="text-2xl font-bold text-long">
              {positions.filter(p => p.isOpen).length}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Closed Positions</div>
            <div className="text-2xl font-bold text-gray-400">
              {positions.filter(p => !p.isOpen).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
