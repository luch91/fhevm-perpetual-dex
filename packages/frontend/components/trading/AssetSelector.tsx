'use client';

import { useState } from 'react';

export interface Asset {
  symbol: string;
  name: string;
  icon: string;
}

const AVAILABLE_ASSETS: Asset[] = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    icon: '₿',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    icon: 'Ξ',
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    icon: '◎',
  },
];

interface AssetSelectorProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

export default function AssetSelector({
  selectedAsset,
  onAssetChange,
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentAsset = AVAILABLE_ASSETS.find(
    (a) => a.symbol === selectedAsset
  ) || AVAILABLE_ASSETS[0];

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
      >
        <span className="text-2xl">{currentAsset.icon}</span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white">
            {currentAsset.symbol}
          </span>
          <span className="text-xs text-gray-400">{currentAsset.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {AVAILABLE_ASSETS.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => {
                  onAssetChange(asset.symbol);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                  asset.symbol === selectedAsset ? 'bg-gray-700/50' : ''
                }`}
              >
                <span className="text-2xl">{asset.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-white">
                    {asset.symbol}
                  </span>
                  <span className="text-xs text-gray-400">{asset.name}</span>
                </div>
                {asset.symbol === selectedAsset && (
                  <svg
                    className="w-5 h-5 text-green-500 ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
