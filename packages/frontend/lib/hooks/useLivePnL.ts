import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

interface Position {
  id: number;
  size: bigint;
  collateral: bigint;
  entryPrice: bigint;
  leverage: bigint;
  timestamp: bigint;
  isLong: boolean;
  isOpen: boolean;
}

interface LivePnLData {
  positionId: number;
  currentPrice: number;
  entryPrice: number;
  pnlPercent: number;
  leveragedPnL: number;
  pnlUSDC: number;
  isLong: boolean;
  leverage: number;
}

/**
 * Hook to calculate live PnL for open positions
 * Updates every 10 seconds by fetching latest prices
 */
export function useLivePnL(positions: Position[]) {
  const { address, isConnected } = useAccount();
  const [livePnLData, setLivePnLData] = useState<Map<number, LivePnLData>>(new Map());
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || positions.length === 0) {
      setLivePnLData(new Map());
      return;
    }

    const fetchPriceAndCalculatePnL = async () => {
      try {
        setIsLoading(true);

        // Fetch current BTC price from CoinGecko
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const data = await response.json();
        const price = data.bitcoin.usd;
        setCurrentPrice(price);

        // Calculate PnL for each open position
        const newPnLData = new Map<number, LivePnLData>();

        positions
          .filter(p => p.isOpen)
          .forEach(position => {
            const entryPriceNum = Number(position.entryPrice) / 1e8;
            const leverageNum = Number(position.leverage);
            const sizeNum = Number(position.size);
            const collateralNum = Number(position.collateral) / 1e6; // USDC has 6 decimals

            // Calculate price change percentage
            const priceChange = ((price - entryPriceNum) / entryPriceNum) * 100;

            // Calculate PnL percentage (positive for profit, negative for loss)
            const pnlPercent = position.isLong ? priceChange : -priceChange;

            // Calculate leveraged PnL
            const leveragedPnL = pnlPercent * leverageNum;

            // Calculate PnL in USDC
            const pnlUSDC = (collateralNum * leveragedPnL) / 100;

            newPnLData.set(position.id, {
              positionId: position.id,
              currentPrice: price,
              entryPrice: entryPriceNum,
              pnlPercent,
              leveragedPnL,
              pnlUSDC,
              isLong: position.isLong,
              leverage: leverageNum,
            });
          });

        setLivePnLData(newPnLData);
      } catch (error) {
        console.error('Error fetching live PnL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchPriceAndCalculatePnL();

    // Update every 10 seconds
    const interval = setInterval(fetchPriceAndCalculatePnL, 10000);

    return () => clearInterval(interval);
  }, [positions, isConnected, address]);

  return {
    livePnLData,
    currentPrice,
    isLoading,
  };
}

/**
 * Hook to calculate liquidation price for a position
 */
export function useLiquidationPrice(
  entryPrice: number,
  leverage: number,
  isLong: boolean,
  maintenanceMargin: number = 5 // 5% maintenance margin
) {
  const liquidationPricePercent = (100 - maintenanceMargin) / leverage;

  const liquidationPrice = isLong
    ? entryPrice * (1 - liquidationPricePercent / 100)
    : entryPrice * (1 + liquidationPricePercent / 100);

  return liquidationPrice;
}

/**
 * Hook to check if position is near liquidation
 */
export function useIsNearLiquidation(
  currentPrice: number,
  liquidationPrice: number,
  isLong: boolean,
  threshold: number = 0.1 // 10% threshold
) {
  const isNearLiquidation = isLong
    ? currentPrice < liquidationPrice * (1 + threshold)
    : currentPrice > liquidationPrice * (1 - threshold);

  return isNearLiquidation;
}
