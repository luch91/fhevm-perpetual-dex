import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { contractAddresses } from '../contracts/addresses';
import { POSITION_MANAGER_ABI } from '../contracts/abis';

export interface HistoricalPosition {
  positionId: number;
  trader: string;
  isLong: boolean;
  size: bigint;
  collateral: bigint;
  entryPrice: bigint;
  exitPrice: bigint | null;
  openTimestamp: number;
  closeTimestamp: number | null;
  pnl: bigint | null;
  status: 'open' | 'closed';
}

export function usePositionHistory(traderAddress?: string) {
  const [history, setHistory] = useState<HistoricalPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();

  useEffect(() => {
    if (!traderAddress || !publicClient) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        // Only fetch last 1000 blocks to avoid rate limit (roughly 3-4 hours on Sepolia)
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;

        // Get PositionOpened events
        const openedLogs = await publicClient.getLogs({
          address: contractAddresses.positionManager as `0x${string}`,
          event: {
            type: 'event',
            name: 'PositionOpened',
            inputs: [
              { indexed: true, name: 'trader', type: 'address' },
              { indexed: true, name: 'positionId', type: 'uint256' },
              { indexed: false, name: 'isLong', type: 'bool' },
              { indexed: false, name: 'entryPrice', type: 'uint256' },
              { indexed: false, name: 'timestamp', type: 'uint256' },
            ],
          },
          args: {
            trader: traderAddress as `0x${string}`,
          },
          fromBlock: fromBlock,
          toBlock: 'latest',
        });

        // Get PositionClosed events
        const closedLogs = await publicClient.getLogs({
          address: contractAddresses.positionManager as `0x${string}`,
          event: {
            type: 'event',
            name: 'PositionClosed',
            inputs: [
              { indexed: true, name: 'trader', type: 'address' },
              { indexed: true, name: 'positionId', type: 'uint256' },
              { indexed: false, name: 'exitPrice', type: 'uint256' },
              { indexed: false, name: 'fundingPayment', type: 'int256' },
              { indexed: false, name: 'timestamp', type: 'uint256' },
            ],
          },
          args: {
            trader: traderAddress as `0x${string}`,
          },
          fromBlock: fromBlock,
          toBlock: 'latest',
        });

        // Build position history map
        const positionMap = new Map<number, HistoricalPosition>();

        // Process opened positions
        for (const log of openedLogs) {
          if (!log.args) continue;

          const positionId = Number(log.args.positionId);

          positionMap.set(positionId, {
            positionId,
            trader: log.args.trader as string,
            isLong: log.args.isLong as boolean,
            size: 0n, // Will fetch from contract
            collateral: 0n, // Will fetch from contract
            entryPrice: log.args.entryPrice as bigint,
            exitPrice: null,
            openTimestamp: Number(log.args.timestamp),
            closeTimestamp: null,
            pnl: null,
            status: 'open',
          });
        }

        // Process closed positions
        for (const log of closedLogs) {
          if (!log.args) continue;

          const positionId = Number(log.args.positionId);
          const position = positionMap.get(positionId);

          if (position) {
            position.exitPrice = log.args.exitPrice as bigint;
            position.closeTimestamp = Number(log.args.timestamp);
            position.status = 'closed';

            // Calculate PnL
            const priceDiff = position.isLong
              ? Number(position.exitPrice) - Number(position.entryPrice)
              : Number(position.entryPrice) - Number(position.exitPrice);

            position.pnl = BigInt(
              Math.floor((priceDiff * Number(position.size)) / 1e8)
            );
          }
        }

        // Fetch position details from contract
        for (const [positionId, position] of positionMap.entries()) {
          try {
            const positionData = (await publicClient.readContract({
              address: contractAddresses.positionManager as `0x${string}`,
              abi: POSITION_MANAGER_ABI,
              functionName: 'getPosition',
              args: [BigInt(positionId)],
            })) as any;

            position.size = positionData.size || positionData[0];
            position.collateral = positionData.collateral || positionData[1];
          } catch (err) {
            console.warn(`Failed to fetch position ${positionId} details:`, err);
          }
        }

        // Convert to array and sort by timestamp (newest first)
        const historyArray = Array.from(positionMap.values()).sort(
          (a, b) => b.openTimestamp - a.openTimestamp
        );

        setHistory(historyArray);
      } catch (err) {
        console.error('Error fetching position history:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [traderAddress, publicClient]);

  // Calculate statistics
  const stats = {
    totalPositions: history.length,
    openPositions: history.filter((p) => p.status === 'open').length,
    closedPositions: history.filter((p) => p.status === 'closed').length,
    totalPnL: history.reduce((sum, p) => sum + (p.pnl || 0n), 0n),
    winRate: 0,
  };

  const closedWithPnL = history.filter((p) => p.status === 'closed' && p.pnl);
  if (closedWithPnL.length > 0) {
    const wins = closedWithPnL.filter((p) => p.pnl && p.pnl > 0n).length;
    stats.winRate = (wins / closedWithPnL.length) * 100;
  }

  return {
    history,
    stats,
    isLoading,
    error,
  };
}
