import OrderForm from '@/components/trading/OrderForm';

export default function TradePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Market Info */}
      <div className="lg:col-span-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">BTC-PERP</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Mark Price</p>
              <p className="text-xl font-semibold">$2,000.00</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">24h Change</p>
              <p className="text-xl font-semibold text-long">+2.5%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">24h Volume</p>
              <p className="text-xl font-semibold">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Funding Rate</p>
              <p className="text-xl font-semibold">0.01%</p>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Chart will be added in Phase 2</p>
        </div>
      </div>

      {/* Order Form */}
      <div className="lg:col-span-1">
        <OrderForm />
      </div>
    </div>
  );
}
