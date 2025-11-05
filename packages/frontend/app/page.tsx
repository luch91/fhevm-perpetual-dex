import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-8 max-w-4xl">
        {/* Hero Section */}
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
          Privacy-Preserving Perpetual Trading
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Trade perpetual futures with complete privacy. Your positions, sizes, and liquidation prices remain encrypted using fhEVM technology.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Encrypted Positions</h3>
            <p className="text-gray-400 text-sm">
              Your position sizes and collateral amounts are fully encrypted on-chain
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Leveraged Trading</h3>
            <p className="text-gray-400 text-sm">
              Trade with up to 10x leverage on your favorite assets
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Hidden Liquidations</h3>
            <p className="text-gray-400 text-sm">
              Liquidation prices remain private, protecting you from targeted attacks
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center mt-12">
          <Link
            href="/trade"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Start Trading
          </Link>
          <Link
            href="/positions"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            View Positions
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-gray-800">
          <div>
            <div className="text-3xl font-bold text-primary-400">100%</div>
            <div className="text-sm text-gray-400 mt-1">Privacy Guaranteed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-400">10x</div>
            <div className="text-sm text-gray-400 mt-1">Max Leverage</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-400">0</div>
            <div className="text-sm text-gray-400 mt-1">Data Leaks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
