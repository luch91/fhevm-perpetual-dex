'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { initFhevm, encryptValue } from '@/lib/fhevm/client';
import { getContractAddress } from '@/lib/contracts/addresses';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';

export default function OrderForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [side, setSide] = useState<'long' | 'short'>('long');
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

      // Initialize fhEVM
      await initFhevm(provider);

      // Encrypt position size and collateral
      console.log('Encrypting position data...');
      const encryptedSize = await encryptValue(BigInt(size));
      const encryptedCollateral = await encryptValue(BigInt(collateral));

      // Get contract
      const positionManagerAddress = getContractAddress(8009, 'positionManager');
      const contract = new ethers.Contract(
        positionManagerAddress,
        POSITION_MANAGER_ABI,
        signer
      );

      // Open position
      console.log('Opening position...');
      const tx = await contract.openPosition(
        encryptedSize.data,
        encryptedSize.signature,
        encryptedCollateral.data,
        encryptedCollateral.signature,
        side === 'long'
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

      {/* Side Selector */}
      <div className="flex gap-2 mb-6">
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
        <p className="text-xs text-gray-400">
          <strong>Note:</strong> Position size and collateral are encrypted using fhEVM. Only you can decrypt and view your position details.
        </p>
      </div>
    </div>
  );
}
