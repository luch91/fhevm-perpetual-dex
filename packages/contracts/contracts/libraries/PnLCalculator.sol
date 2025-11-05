// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "fhevm/lib/TFHE.sol";

/**
 * @title PnLCalculator
 * @notice Library for calculating profit and loss on encrypted positions
 * @dev Uses fhEVM for privacy-preserving PnL calculations
 */
library PnLCalculator {
    uint256 constant PRECISION = 1e8; // 8 decimal places for price precision

    /**
     * @notice Calculate unrealized PnL for a long position
     * @param encryptedSize Encrypted position size
     * @param entryPrice Entry price (public)
     * @param currentPrice Current market price (public)
     * @return encryptedPnL Encrypted profit/loss (NOTE: Raw value, not divided by PRECISION)
     * @dev Caller should divide result by PRECISION when decrypting
     */
    function calculateLongPnL(
        euint64 encryptedSize,
        uint256 entryPrice,
        uint256 currentPrice
    ) internal returns (euint64) {
        // PnL = size * (currentPrice - entryPrice)
        // Note: Division by PRECISION should be done after decryption

        if (currentPrice >= entryPrice) {
            // Profit case
            uint256 priceDelta = currentPrice - entryPrice;
            euint64 encryptedDelta = TFHE.asEuint64(priceDelta);
            return TFHE.mul(encryptedSize, encryptedDelta);
        } else {
            // Loss case (handle as negative in application layer)
            uint256 priceDelta = entryPrice - currentPrice;
            euint64 encryptedDelta = TFHE.asEuint64(priceDelta);
            return TFHE.mul(encryptedSize, encryptedDelta);
        }
    }

    /**
     * @notice Calculate unrealized PnL for a short position
     * @param encryptedSize Encrypted position size
     * @param entryPrice Entry price (public)
     * @param currentPrice Current market price (public)
     * @return encryptedPnL Encrypted profit/loss (NOTE: Raw value, not divided by PRECISION)
     * @dev Caller should divide result by PRECISION when decrypting
     */
    function calculateShortPnL(
        euint64 encryptedSize,
        uint256 entryPrice,
        uint256 currentPrice
    ) internal returns (euint64) {
        // PnL = size * (entryPrice - currentPrice)
        // Note: Division by PRECISION should be done after decryption

        if (entryPrice >= currentPrice) {
            // Profit case
            uint256 priceDelta = entryPrice - currentPrice;
            euint64 encryptedDelta = TFHE.asEuint64(priceDelta);
            return TFHE.mul(encryptedSize, encryptedDelta);
        } else {
            // Loss case
            uint256 priceDelta = currentPrice - entryPrice;
            euint64 encryptedDelta = TFHE.asEuint64(priceDelta);
            return TFHE.mul(encryptedSize, encryptedDelta);
        }
    }

    /**
     * @notice Calculate position value at current price
     * @param encryptedSize Encrypted position size
     * @param currentPrice Current market price
     * @return encryptedValue Encrypted position value (NOTE: Raw value, not divided by PRECISION)
     * @dev Caller should divide result by PRECISION when decrypting
     */
    function calculatePositionValue(euint64 encryptedSize, uint256 currentPrice)
        internal
        returns (euint64)
    {
        // Value = size * currentPrice
        // Note: Division by PRECISION should be done after decryption
        euint64 encryptedPrice = TFHE.asEuint64(currentPrice);
        return TFHE.mul(encryptedSize, encryptedPrice);
    }

    /**
     * @notice Calculate liquidation price for a long position
     * @param entryPrice Entry price
     * @param leverage Leverage used
     * @param maintenanceMarginBps Maintenance margin in basis points
     * @return liquidationPrice Price at which position will be liquidated
     */
    function calculateLongLiquidationPrice(
        uint256 entryPrice,
        uint256 leverage,
        uint256 maintenanceMarginBps
    ) internal pure returns (uint256) {
        // Liquidation occurs when:
        // (entryPrice - liquidationPrice) / entryPrice >= (1 - maintenanceMargin) / leverage

        uint256 bpsDivisor = 10000;
        uint256 maintenanceRatio = (bpsDivisor - maintenanceMarginBps);

        // liquidationPrice = entryPrice * (1 - maintenanceRatio / (leverage * bpsDivisor))
        uint256 priceDropRatio = (maintenanceRatio * PRECISION) / (leverage * bpsDivisor);
        uint256 liquidationPrice = (entryPrice * (PRECISION - priceDropRatio)) / PRECISION;

        return liquidationPrice;
    }

    /**
     * @notice Calculate liquidation price for a short position
     * @param entryPrice Entry price
     * @param leverage Leverage used
     * @param maintenanceMarginBps Maintenance margin in basis points
     * @return liquidationPrice Price at which position will be liquidated
     */
    function calculateShortLiquidationPrice(
        uint256 entryPrice,
        uint256 leverage,
        uint256 maintenanceMarginBps
    ) internal pure returns (uint256) {
        // For short: liquidation when price goes up
        // liquidationPrice = entryPrice * (1 + maintenanceRatio / (leverage * bpsDivisor))

        uint256 bpsDivisor = 10000;
        uint256 maintenanceRatio = (bpsDivisor - maintenanceMarginBps);

        uint256 priceRiseRatio = (maintenanceRatio * PRECISION) / (leverage * bpsDivisor);
        uint256 liquidationPrice = (entryPrice * (PRECISION + priceRiseRatio)) / PRECISION;

        return liquidationPrice;
    }

    /**
     * @notice Calculate effective leverage of a position
     * @param encryptedPositionValue Encrypted position value
     * @return Ratio of position value to collateral (NOTE: Not actual leverage, needs calculation after decryption)
     * @dev Due to lack of division on encrypted types, return position value for now
     *      Actual leverage = decrypted position value / decrypted collateral
     */
    function calculateEffectiveLeverage(
        euint64 encryptedPositionValue,
        euint64 /* encryptedCollateral */
    ) internal pure returns (euint64) {
        // Note: Division not supported on encrypted types
        // Return position value; leverage must be calculated client-side after decryption
        return encryptedPositionValue;
    }

    /**
     * @notice Check if position is profitable
     * @param isLong Whether position is long
     * @param entryPrice Entry price
     * @param currentPrice Current price
     * @return bool indicating if position is in profit
     */
    function isPositionProfitable(
        bool isLong,
        uint256 entryPrice,
        uint256 currentPrice
    ) internal pure returns (bool) {
        if (isLong) {
            return currentPrice > entryPrice;
        } else {
            return entryPrice > currentPrice;
        }
    }
}
