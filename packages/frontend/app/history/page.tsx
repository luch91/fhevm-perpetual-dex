import TransactionHistory from '@/components/history/TransactionHistory';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-gray-400">
          View all your past and current positions, track your performance, and export data for tax reporting.
        </p>
      </div>

      <TransactionHistory />
    </div>
  );
}
