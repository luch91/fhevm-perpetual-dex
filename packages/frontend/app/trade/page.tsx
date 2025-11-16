'use client';

import { useState } from 'react';
import OrderForm from '@/components/trading/OrderForm';
import RealTimePriceDisplay from '@/components/trading/RealTimePriceDisplay';
import TradingChart from '@/components/trading/TradingChart';
import PositionsList from '@/components/positions/PositionsList';

export default function TradePage() {
  const [selectedAsset, setSelectedAsset] = useState<'BTC/USD' | 'ETH/USD' | 'SOL/USD'>('BTC/USD');

  return (
    <div className="space-y-6">
      {/* Real-Time Prices */}
      <RealTimePriceDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <TradingChart symbol={selectedAsset} />
        </div>

        {/* Order Form */}
        <div className="lg:col-span-1">
          <OrderForm onAssetChange={setSelectedAsset} />
        </div>
      </div>

      {/* Positions List */}
      <PositionsList />
    </div>
  );
}
