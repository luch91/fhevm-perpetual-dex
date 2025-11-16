'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';

const ASSETS = ['BTC/USD', 'ETH/USD', 'SOL/USD'] as const;
type Asset = typeof ASSETS[number];

interface OrderFormProps {
  onAssetChange?: (asset: Asset) => void;
}

export default function OrderForm({ onAssetChange }: OrderFormProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [asset, setAsset] = useState<Asset>('BTC/USD');

  const handleAssetChange = (newAsset: Asset) => {
    setAsset(newAsset);
    onAssetChange?.(newAsset);
  };
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState<number>(1);
  const [size, setSize] = useState('');
  const [collateral, setCollateral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOpenPosition = async () => {
    if (!isConnected || !address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!size || !collateral) {
      setError('Please enter size and collateral');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Convert wallet client to ethers provider
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // Get contract address from environment
      const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS as string;
      if (!positionManagerAddress) {
        throw new Error('Position Manager address not configured');
      }

      const contract = new ethers.Contract(
        positionManagerAddress,
        POSITION_MANAGER_ABI,
        signer
      );

      // Open position with plaintext inputs (encrypted on-chain)
      console.log(`Opening ${side} position with ${leverage}x leverage...`);
      console.log(`Asset: ${asset}, Size: ${size}, Collateral: ${collateral}`);

      const tx = await contract.openPosition(
        BigInt(size),
        BigInt(collateral),
        side === 'long',
        BigInt(leverage)
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();

      console.log('Position opened! Receipt:', receipt);
      setSuccess(`Position opened successfully! TX: ${tx.hash.slice(0, 10)}...`);

      // Reset form
      setSize('');
      setCollateral('');
    } catch (err: any) {
      console.error('Error opening position:', err);
      setError(err.message || 'Failed to open position');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Open Position</h2>

      {/* Asset Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Asset
        </label>
        <select
          value={asset}
          onChange={(e) => handleAssetChange(e.target.value as Asset)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ASSETS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Side Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide('long')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            side === 'long'
              ? 'bg-long text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide('short')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            side === 'short'
              ? 'bg-short text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Short
        </button>
      </div>

      {/* Leverage Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Leverage: {leverage}x
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((leverage - 1) / 9) * 100}%, #374151 ${((leverage - 1) / 9) * 100}%, #374151 100%)`
            }}
          />
          <div className="flex gap-1">
            {[1, 2, 5, 10].map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  leverage === lev
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Higher leverage = Higher risk & potential reward
        </p>
      </div>

      {/* Size Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Position Size
        </label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Enter size (e.g., 100)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Encrypted on-chain</p>
      </div>

      {/* Collateral Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Collateral
        </label>
        <input
          type="number"
          value={collateral}
          onChange={(e) => setCollateral(e.target.value)}
          placeholder="Enter collateral (e.g., 1000)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Encrypted on-chain</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-800 rounded-lg text-green-200 text-sm">
          {success}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleOpenPosition}
        disabled={isLoading || !isConnected}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isLoading || !isConnected
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : side === 'long'
            ? 'bg-long hover:bg-long-dark text-white'
            : 'bg-short hover:bg-short-dark text-white'
        }`}
      >
        {isLoading
          ? 'Opening Position...'
          : !isConnected
          ? 'Connect Wallet'
          : `Open ${side === 'long' ? 'Long' : 'Short'} Position`}
      </button>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">
          <strong>Note:</strong> Position size and collateral are encrypted using fhEVM. Only you can decrypt and view your position details.
        </p>
        {leverage > 1 && (
          <p className="text-xs text-yellow-400">
            <strong>Warning:</strong> Using {leverage}x leverage amplifies both gains and losses. Trade responsibly.
          </p>
        )}
      </div>
    </div>
  );
}
