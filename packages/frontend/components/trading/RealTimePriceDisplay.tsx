'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { CHAINLINK_ORACLE_ABI } from '@/lib/contracts/abis';

interface PriceData {
  price: string;
  decimals: number;
  timestamp: number;
  isFresh: boolean;
  change24h?: number; // Placeholder for future implementation
}

interface Asset {
  symbol: string;
  name: string;
  color: string;
}

const ASSETS: Asset[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', color: 'text-orange-500' },
  { symbol: 'ETH/USD', name: 'Ethereum', color: 'text-blue-500' },
  { symbol: 'SOL/USD', name: 'Solana', color: 'text-purple-500' },
];

// Mock prices for demo/fallback
const MOCK_PRICES: Record<string, PriceData> = {
  'BTC/USD': {
    price: '97234.50',
    decimals: 8,
    timestamp: Math.floor(Date.now() / 1000),
    isFresh: false,
  },
  'ETH/USD': {
    price: '3456.78',
    decimals: 8,
    timestamp: Math.floor(Date.now() / 1000),
    isFresh: false,
  },
  'SOL/USD': {
    price: '150.00',
    decimals: 8,
    timestamp: Math.floor(Date.now() / 1000),
    isFresh: false,
  },
};

const CHAINLINK_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS as `0x${string}`;

export default function RealTimePriceDisplay() {
  const publicClient = usePublicClient();
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    // If no publicClient, use mock prices
    if (!publicClient) {
      setPrices(MOCK_PRICES);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const pricePromises = ASSETS.map(async (asset) => {
        // Use Chainlink oracle for all assets (BTC, ETH, SOL)
        const oracleAddress = CHAINLINK_ORACLE_ADDRESS;

        if (!oracleAddress) {
          console.warn(`No oracle address configured for ${asset.symbol}, using mock price`);
          return {
            symbol: asset.symbol,
            data: MOCK_PRICES[asset.symbol],
          };
        }

        try {
          const [priceData, isFresh] = await Promise.all([
            publicClient.readContract({
              address: oracleAddress,
              abi: CHAINLINK_ORACLE_ABI,
              functionName: 'getPrice',
              args: [asset.symbol],
            }),
            publicClient.readContract({
              address: oracleAddress,
              abi: CHAINLINK_ORACLE_ABI,
              functionName: 'isPriceFresh',
              args: [asset.symbol],
            }),
          ]);

          const [price, decimals, timestamp] = priceData;

          return {
            symbol: asset.symbol,
            data: {
              price: formatUnits(price, decimals),
              decimals: Number(decimals),
              timestamp: Number(timestamp),
              isFresh: isFresh as boolean,
            },
          };
        } catch (err) {
          console.warn(`Oracle fetch failed for ${asset.symbol}, using mock price:`, err);
          return {
            symbol: asset.symbol,
            data: MOCK_PRICES[asset.symbol],
          };
        }
      });

      const results = await Promise.all(pricePromises);

      const newPrices: Record<string, PriceData> = {};
      results.forEach((result) => {
        if (result) {
          newPrices[result.symbol] = result.data;
        }
      });

      setPrices(newPrices);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching prices, falling back to mock data:', err);
      setPrices(MOCK_PRICES);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, [publicClient]);

  if (loading) {
    return (
      <div className="flex gap-4">
        {ASSETS.map((asset) => (
          <div key={asset.symbol} className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-200">
        <p className="text-sm">Failed to load prices: {error}</p>
        <button
          onClick={fetchPrices}
          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {ASSETS.map((asset) => {
        const priceData = prices[asset.symbol];

        return (
          <div
            key={asset.symbol}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${asset.color}`}>{asset.symbol.split('/')[0]}</span>
              {priceData?.isFresh ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              ) : (
                <span className="text-xs text-yellow-400">Stale</span>
              )}
            </div>

            {priceData ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  ${parseFloat(priceData.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                {priceData.change24h !== undefined && (
                  <div
                    className={`text-sm ${
                      priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {priceData.change24h >= 0 ? '+' : ''}
                    {priceData.change24h.toFixed(2)}%
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Updated: {new Date(priceData.timestamp * 1000).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                <p className="text-sm">Price not available</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
