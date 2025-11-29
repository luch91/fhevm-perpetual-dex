'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { MockUSDC_ABI } from '@/lib/contracts/mockUsdcAbi';
import toast from '@/lib/utils/toast';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const MAX_MINT_AMOUNT = 1000000; // 1M USDC max
const MIN_MINT_AMOUNT = 1;

export default function GetTestUSDC() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('1000');
  const [mintError, setMintError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Read USDC balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: MockUSDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESS,
    },
  });

  // Mint function with error handling
  const {
    writeContract,
    data: hash,
    isPending: isMinting,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Validate amount
  useEffect(() => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid amount');
    } else if (numAmount < MIN_MINT_AMOUNT) {
      setValidationError(`Minimum amount is ${MIN_MINT_AMOUNT} USDC`);
    } else if (numAmount > MAX_MINT_AMOUNT) {
      setValidationError(`Maximum amount is ${MAX_MINT_AMOUNT.toLocaleString()} USDC`);
    } else {
      setValidationError(null);
    }
  }, [amount]);

  // Refetch balance when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      toast.success(`Successfully minted ${amount} USDC!`, 'Mint Complete');
    }
  }, [isSuccess, refetchBalance, amount]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      const errorMsg = writeError.message || 'Transaction failed';
      setMintError(errorMsg);
      toast.error(errorMsg, 'Minting Failed');
    }
  }, [writeError]);

  const handleMint = () => {
    if (!address || !amount || !USDC_ADDRESS || validationError) return;

    setMintError(null);
    resetWrite();

    writeContract({
      address: USDC_ADDRESS,
      abi: MockUSDC_ABI,
      functionName: 'mintWithDecimals',
      args: [address, BigInt(amount)],
    });
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-400">
          Connect your wallet to get test USDC tokens
        </p>
      </div>
    );
  }

  if (!USDC_ADDRESS) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-400">
          USDC contract address not configured. Check NEXT_PUBLIC_USDC_ADDRESS environment variable.
        </p>
      </div>
    );
  }

  const formattedBalance = balance ? formatUnits(balance as bigint, 6) : '0';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Test USDC Faucet</h3>
        <div className="text-sm text-gray-400">
          Balance: <span className="font-mono font-bold text-green-400">{formattedBalance} USDC</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Amount to mint
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-md focus:outline-none focus:ring-2 ${
                validationError
                  ? 'border-red-700 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-blue-500'
              }`}
              placeholder="1000"
            />
            {validationError && (
              <p className="text-red-400 text-xs mt-1">{validationError}</p>
            )}
          </div>
          <button
            onClick={handleMint}
            disabled={isMinting || isConfirming || !amount || !!validationError}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isConfirming && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isConfirming ? 'Confirming...' : isMinting ? 'Waiting...' : 'Get USDC'}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>This is a testnet faucet for demo purposes</p>
        <p>Anyone can mint unlimited USDC tokens</p>
        <p>These tokens have no real value</p>
      </div>

      {mintError && (
        <div className="bg-red-900/20 border border-red-800 rounded p-3 text-sm text-red-400">
          Error: {mintError.length > 100 ? mintError.slice(0, 100) + '...' : mintError}
        </div>
      )}

      {isMinting && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 text-sm text-yellow-400">
          Please confirm transaction in your wallet...
        </div>
      )}

      {isConfirming && (
        <div className="bg-blue-900/20 border border-blue-800 rounded p-3 text-sm text-blue-400">
          Transaction pending... Please wait for confirmation
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-900/20 border border-green-800 rounded p-3 text-sm text-green-400">
          Successfully minted {amount} USDC!
        </div>
      )}

      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Quick mint options:</h4>
        <div className="flex gap-2">
          {['100', '1000', '10000', '100000'].map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount)}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              {quickAmount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
