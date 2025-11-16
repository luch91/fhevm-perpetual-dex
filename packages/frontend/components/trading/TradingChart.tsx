'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries, Time } from 'lightweight-charts';

interface TradingChartProps {
  symbol?: string;
}

export default function TradingChart({ symbol = 'BTC/USD' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1H');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#111827' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Generate mock data (replace with real data from API later)
    const generateMockData = (): CandlestickData[] => {
      const data: CandlestickData[] = [];
      const basePrice = symbol === 'BTC/USD' ? 97000 : symbol === 'ETH/USD' ? 3200 : 150;
      const now = Date.now() / 1000;
      const interval = timeframe === '1H' ? 3600 : timeframe === '4H' ? 14400 : timeframe === '1D' ? 86400 : 604800;

      for (let i = 100; i >= 0; i--) {
        const time = (now - i * interval) as Time;
        const volatility = basePrice * 0.02;
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
          time,
          open,
          high,
          low,
          close,
        });
      }

      return data;
    };

    const mockData = generateMockData();
    candlestickSeries.setData(mockData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, timeframe]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-white">{symbol}</h3>
          <p className="text-sm text-gray-400">Real-time price chart</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['1H', '4H', '1D', '1W'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Chart Footer */}
      <div className="p-3 bg-gray-800/50 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Note: Charts display mock data for Phase 4 demo. Real-time WebSocket data will be integrated in production.
        </p>
      </div>
    </div>
  );
}
