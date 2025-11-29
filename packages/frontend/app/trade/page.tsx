'use client';

import { useState } from 'react';
import OrderForm from '@/components/trading/OrderForm';
import RealTimePriceDisplay from '@/components/trading/RealTimePriceDisplay';
import TradingChart from '@/components/trading/TradingChart';
import PositionsList from '@/components/positions/PositionsList';
import GetTestUSDC from '@/components/trading/GetTestUSDC';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function TradePage() {
  const [selectedAsset, setSelectedAsset] = useState<'BTC/USD' | 'ETH/USD' | 'SOL/USD'>('BTC/USD');

  return (
    <div className="space-y-6">
      {/* Real-Time Prices */}
      <ErrorBoundary>
        <RealTimePriceDisplay />
      </ErrorBoundary>

      {/* Test USDC Faucet */}
      <ErrorBoundary>
        <GetTestUSDC />
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Order Form - Show first on mobile for better UX */}
        <div className="lg:col-span-1 lg:order-2">
          <ErrorBoundary>
            <OrderForm onAssetChange={setSelectedAsset} />
          </ErrorBoundary>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 lg:order-1">
          <ErrorBoundary>
            <TradingChart symbol={selectedAsset} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Positions List */}
      <ErrorBoundary>
        <PositionsList />
      </ErrorBoundary>
    </div>
  );
}
