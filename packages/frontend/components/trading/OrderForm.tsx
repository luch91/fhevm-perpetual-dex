'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { POSITION_MANAGER_ABI } from '@/lib/contracts/abis';
import { mockUsdcAbi } from '@/lib/contracts/mockUsdcAbi';
import { parseContractError, validatePositionParams, checkUSDCBalance, checkUSDCAllowance } from '@/lib/utils/errorMessages';
import AssetSelector from './AssetSelector';

const ASSETS = ['BTC/USD', 'ETH/USD', 'SOL/USD'] as const;
type Asset = typeof ASSETS[number];

interface OrderFormProps {
  onAssetChange?: (asset: Asset) => void;
}

export default function OrderForm({ onAssetChange }: OrderFormProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [asset, setAsset] = useState<Asset>('BTC/USD');

  const handleAssetChange = (newAsset: string) => {
    setAsset(newAsset as Asset);
    onAssetChange?.(newAsset as Asset);
  };
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState<number>(1);
  const [size, setSize] = useState('');
  const [collateral, setCollateral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // USDC state
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>(0n);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Gas estimation
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  const [estimatingGas, setEstimatingGas] = useState(false);

  // Fetch USDC balance and allowance
  useEffect(() => {
    const fetchUSDCData = async () => {
      if (!isConnected || !address || !walletClient) return;

      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as string;
        const pmAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS as string;

        if (!usdcAddress || !pmAddress) return;

        const usdcContract = new ethers.Contract(usdcAddress, mockUsdcAbi, provider);

        const [balance, allowance] = await Promise.all([
          usdcContract.balanceOf(address),
          usdcContract.allowance(address, pmAddress),
        ]);

        setUsdcBalance(balance);
        setUsdcAllowance(allowance);
      } catch (err) {
        console.error('Error fetching USDC data:', err);
      }
    };

    fetchUSDCData();
    const interval = setInterval(fetchUSDCData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [isConnected, address, walletClient]);

  // Check if approval is needed
  useEffect(() => {
    if (!collateral) {
      setNeedsApproval(false);
      return;
    }

    const collateralBigInt = BigInt(Math.floor(Number(collateral) * 1e6));
    setNeedsApproval(usdcAllowance < collateralBigInt);
  }, [collateral, usdcAllowance]);

  // Estimate gas when parameters change
  useEffect(() => {
    const estimateGas = async () => {
      if (!isConnected || !address || !walletClient || !size || !collateral) {
        setEstimatedGas('');
        return;
      }

      // Validate inputs first
      const validation = validatePositionParams(Number(size), Number(collateral), leverage);
      if (validation) {
        setEstimatedGas('');
        return;
      }

      try {
        setEstimatingGas(true);
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        const pmAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS as string;

        if (!pmAddress) return;

        const contract = new ethers.Contract(pmAddress, POSITION_MANAGER_ABI, signer);

        const gasEstimate = await contract.openPosition.estimateGas(
          BigInt(size),
          BigInt(Math.floor(Number(collateral) * 1e6)),
          side === 'long',
          BigInt(leverage)
        );

        // Get gas price
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || 0n;

        // Calculate cost in ETH
        const gasCost = gasEstimate * gasPrice;
        const gasCostEth = Number(ethers.formatEther(gasCost));

        // Rough USD conversion (assume ETH = $2000)
        const gasCostUsd = gasCostEth * 2000;

        setEstimatedGas(`~$${gasCostUsd.toFixed(2)}`);
      } catch (err) {
        console.error('Gas estimation failed:', err);
        setEstimatedGas('');
      } finally {
        setEstimatingGas(false);
      }
    };

    const debounce = setTimeout(estimateGas, 500);
    return () => clearTimeout(debounce);
  }, [size, collateral, leverage, side, isConnected, address, walletClient]);

  const handleApproveUSDC = async () => {
    if (!isConnected || !address || !walletClient) return;

    try {
      setIsLoading(true);
      setLoadingStep('Approving USDC...');
      setError(null);

      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as string;
      const pmAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS as string;

      const usdcContract = new ethers.Contract(usdcAddress, mockUsdcAbi, signer);

      // Approve a large amount (100k USDC)
      const tx = await usdcContract.approve(pmAddress, ethers.parseUnits('100000', 6));

      setLoadingStep('Waiting for confirmation...');
      await tx.wait();

      setSuccess('USDC approved successfully!');
      setNeedsApproval(false);

      // Refresh allowance
      const newAllowance = await usdcContract.allowance(address, pmAddress);
      setUsdcAllowance(newAllowance);
    } catch (err: any) {
      console.error('Approval error:', err);
      const errorDetails = parseContractError(err);
      setError(`${errorDetails.title}: ${errorDetails.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleOpenPosition = async () => {
    if (!isConnected || !address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    // Validate inputs
    const validation = validatePositionParams(Number(size), Number(collateral), leverage);
    if (validation) {
      setError(`${validation.title}: ${validation.message}`);
      return;
    }

    const collateralBigInt = BigInt(Math.floor(Number(collateral) * 1e6));

    // Check USDC balance
    const balanceCheck = checkUSDCBalance(usdcBalance, collateralBigInt);
    if (balanceCheck) {
      setError(`${balanceCheck.title}: ${balanceCheck.message}\n${balanceCheck.action || ''}`);
      return;
    }

    // Check USDC allowance
    const allowanceCheck = checkUSDCAllowance(usdcAllowance, collateralBigInt);
    if (allowanceCheck) {
      setError(`${allowanceCheck.title}: ${allowanceCheck.message}\n${allowanceCheck.action || ''}`);
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

      // Open position
      setLoadingStep('Sending transaction...');
      const tx = await contract.openPosition(
        BigInt(size),
        collateralBigInt,
        side === 'long',
        BigInt(leverage)
      );

      setLoadingStep(`Waiting for confirmation... (${tx.hash.slice(0, 10)}...)`);
      const receipt = await tx.wait();

      setLoadingStep('Position opened!');
      setSuccess(`Position opened successfully! TX: ${tx.hash.slice(0, 10)}...`);

      // Reset form
      setSize('');
      setCollateral('');

      // Refresh USDC balance
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as string;
      const usdcContract = new ethers.Contract(usdcAddress, mockUsdcAbi, provider);
      const newBalance = await usdcContract.balanceOf(address);
      setUsdcBalance(newBalance);
    } catch (err: any) {
      console.error('Error opening position:', err);
      const errorDetails = parseContractError(err);
      setError(`${errorDetails.title}: ${errorDetails.message}${errorDetails.action ? '\n\n' + errorDetails.action : ''}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Open Position</h2>

      {/* Asset Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Asset
        </label>
        <AssetSelector
          selectedAsset={asset}
          onAssetChange={handleAssetChange}
        />
      </div>

      {/* Side Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide('long')}
          className={`flex-1 py-3 md:py-3 min-h-[44px] rounded-lg font-semibold transition-colors ${
            side === 'long'
              ? 'bg-long text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide('short')}
          className={`flex-1 py-3 md:py-3 min-h-[44px] rounded-lg font-semibold transition-colors ${
            side === 'short'
              ? 'bg-short text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
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
          <div className="flex gap-1 md:gap-2">
            {[1, 2, 5, 10].map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`px-3 md:px-4 py-2 min-h-[44px] rounded text-sm md:text-base font-medium transition-colors ${
                  leverage === lev
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 md:py-3 min-h-[44px] text-base md:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Encrypted on-chain</p>
      </div>

      {/* Collateral Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Collateral (USDC)
        </label>
        <input
          type="number"
          value={collateral}
          onChange={(e) => setCollateral(e.target.value)}
          placeholder="Enter collateral (e.g., 1000)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 md:py-3 min-h-[44px] text-base md:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">Encrypted on-chain</p>
          {isConnected && (
            <p className="text-xs text-gray-400">
              Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} USDC
            </p>
          )}
        </div>
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

      {/* Loading Step Indicator */}
      {loadingStep && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-800 rounded-lg text-blue-200 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200"></div>
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Approve USDC Button (shown when approval needed) */}
      {needsApproval && isConnected && collateral && (
        <button
          onClick={handleApproveUSDC}
          disabled={isLoading}
          className="w-full py-3 md:py-3 min-h-[48px] mb-3 rounded-lg font-semibold text-base transition-colors bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Approving...' : 'Approve USDC'}
        </button>
      )}

      {/* Submit Button */}
      <button
        onClick={handleOpenPosition}
        disabled={isLoading || !isConnected || needsApproval}
        className={`w-full py-3 md:py-3 min-h-[48px] rounded-lg font-semibold text-base transition-colors ${
          isLoading || !isConnected || needsApproval
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : side === 'long'
            ? 'bg-long hover:bg-long-dark active:opacity-90 text-white'
            : 'bg-short hover:bg-short-dark active:opacity-90 text-white'
        }`}
      >
        {isLoading
          ? loadingStep || 'Processing...'
          : !isConnected
          ? 'Connect Wallet'
          : needsApproval
          ? 'Approve USDC First'
          : `Open ${side === 'long' ? 'Long' : 'Short'} Position${estimatedGas ? ` ${estimatedGas}` : ''}`}
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
