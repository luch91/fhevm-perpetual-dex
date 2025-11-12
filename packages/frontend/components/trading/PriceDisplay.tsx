"use client";

import { useState, useEffect } from "react";
import { TRADING_CONFIG, CONTRACTS } from "@/lib/config/contracts";
import { useFormattedPrice } from "@/lib/hooks/usePriceOracle";

interface PriceDisplayProps {
  asset?: string;
  price?: bigint;
  className?: string;
}

export default function PriceDisplay({
  asset = TRADING_CONFIG.DEFAULT_ASSET,
  price,
  className = ""
}: PriceDisplayProps) {
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isPositive, setIsPositive] = useState(true);

  // Try to fetch real price from oracle if contract is deployed
  const {
    formattedPrice: oraclePrice,
    lastUpdated,
    isLoading,
    error,
  } = useFormattedPrice(asset);

  // Determine which price to display
  // Priority: prop price > oracle price > mock price
  const hasOracleContract = !!CONTRACTS.PRICE_ORACLE;
  const useRealPrice = hasOracleContract && !isLoading && !error && oraclePrice !== "0.00";

  let displayPrice: string;
  if (price) {
    // Use prop price if provided
    const priceNum = Number(price) / TRADING_CONFIG.PRICE_PRECISION;
    displayPrice = priceNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (useRealPrice) {
    // Use oracle price if available
    displayPrice = oraclePrice;
  } else {
    // Fallback to mock price
    displayPrice = "45,000.00";
  }

  // Simulate price changes for demo when using mock data
  useEffect(() => {
    if (!useRealPrice) {
      const interval = setInterval(() => {
        const change = (Math.random() - 0.5) * 2; // -1% to +1%
        setPriceChange(change);
        setIsPositive(change >= 0);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [useRealPrice]);

  return (
    <div className={`${className}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">{asset}</div>
            <div className="text-3xl font-bold text-white">
              ${displayPrice}
            </div>
          </div>
          <div className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <div className="text-2xl font-semibold">
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
            <div className="text-sm">24h Change</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">24h High</div>
            <div className="text-white font-medium">${(parseFloat(displayPrice.replace(/,/g, '')) * 1.02).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-gray-400">24h Low</div>
            <div className="text-white font-medium">${(parseFloat(displayPrice.replace(/,/g, '')) * 0.98).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-gray-400">Volume</div>
            <div className="text-white font-medium">$1.2M</div>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-500">
              {useRealPrice ? (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Live from Oracle</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  <span>Demo Data</span>
                </span>
              )}
            </div>
            {lastUpdated && useRealPrice && (
              <div className="text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
