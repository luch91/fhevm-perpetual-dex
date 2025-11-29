import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">
          Track your trading performance, analyze your positions, and improve your strategy.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
