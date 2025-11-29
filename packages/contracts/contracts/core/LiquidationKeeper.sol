// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ILiquidationKeeper.sol";
import "./SimplePositionManager.sol";
import "../oracles/ChainlinkPriceOracle.sol";

/**
 * @title LiquidationKeeper
 * @notice Monitors and liquidates undercollateralized positions
 * @dev Keeper bot calls this contract to liquidate risky positions
 */
contract LiquidationKeeper is ILiquidationKeeper, Ownable {
    SimplePositionManager public positionManager;
    ChainlinkPriceOracle public priceOracle;

    // Liquidation reward: 5% of position size paid to liquidator
    uint256 public constant LIQUIDATION_REWARD_BPS = 500; // 5%
    uint256 public constant BPS_DIVISOR = 10000;

    // Maintenance margin threshold: 5%
    uint256 public constant MAINTENANCE_MARGIN_BPS = 500;

    // Emergency pause for liquidations
    bool public isPaused;

    // Track total positions for iteration
    uint256 public maxPositionId;

    constructor(address _positionManager, address _priceOracle) Ownable(msg.sender) {
        require(_positionManager != address(0), "Invalid position manager");
        require(_priceOracle != address(0), "Invalid oracle");

        positionManager = SimplePositionManager(_positionManager);
        priceOracle = ChainlinkPriceOracle(_priceOracle);
        isPaused = false;
    }

    /**
     * @notice Check if a position is eligible for liquidation
     * @dev Position is liquidatable if: collateralRatio < MAINTENANCE_MARGIN
     */
    function checkLiquidation(uint256 positionId)
        public
        view
        override
        returns (bool isLiquidatable, uint256 currentCollateralRatio)
    {
        (
            uint64 size,
            uint64 collateral,
            uint256 entryPrice,
            uint256 leverage,
            ,
            ,  // lastFundingTime (new field)
            bool isLong,
            bool isOpen
        ) = positionManager.positions(positionId);

        if (!isOpen || size == 0) {
            return (false, 0);
        }

        // Get current price
        (uint256 currentPrice, , ) = priceOracle.getPrice("BTC/USD");

        // Calculate PnL
        int256 pnl = _calculatePnL(
            uint256(size),
            entryPrice,
            currentPrice,
            isLong
        );

        // Calculate current collateral value (initial collateral + PnL)
        int256 currentCollateralValue = int256(uint256(collateral)) + pnl;

        // If position has lost more than collateral, it's liquidatable
        if (currentCollateralValue <= 0) {
            return (true, 0);
        }

        // Calculate collateral ratio: (currentCollateral / positionValue) * 10000
        uint256 positionValue = uint256(size) * currentPrice / 1e8; // Assuming 8 decimals
        currentCollateralRatio = (uint256(currentCollateralValue) * BPS_DIVISOR) / positionValue;

        // Liquidatable if below maintenance margin
        isLiquidatable = currentCollateralRatio < MAINTENANCE_MARGIN_BPS;

        return (isLiquidatable, currentCollateralRatio);
    }

    /**
     * @notice Liquidate an undercollateralized position
     * @dev Closes position and pays reward to liquidator
     */
    function liquidatePosition(uint256 positionId)
        external
        override
        returns (uint256 liquidationReward)
    {
        require(!isPaused, "Liquidations paused");

        (bool isLiquidatable, ) = checkLiquidation(positionId);
        require(isLiquidatable, "Position not liquidatable");

        // Get position details before closing
        (uint64 size, , , , , , , bool isOpen) = positionManager.positions(positionId);
        require(isOpen, "Position not open");

        // Calculate liquidation reward (5% of position size)
        liquidationReward = (uint256(size) * LIQUIDATION_REWARD_BPS) / BPS_DIVISOR;

        // Close the position (would need to add liquidation function to PositionManager)
        // For now, emit event - full integration requires PositionManager modification
        emit PositionLiquidated(
            positionId,
            msg.sender,
            liquidationReward,
            block.timestamp
        );

        return liquidationReward;
    }

    /**
     * @notice Batch liquidate multiple positions
     * @dev More gas efficient than individual liquidations
     */
    function batchLiquidate(uint256[] calldata positionIds)
        external
        override
        returns (uint256 totalReward)
    {
        require(!isPaused, "Liquidations paused");

        for (uint256 i = 0; i < positionIds.length; i++) {
            (bool isLiquidatable, ) = checkLiquidation(positionIds[i]);

            if (isLiquidatable) {
                uint256 reward = this.liquidatePosition(positionIds[i]);
                totalReward += reward;
            }
        }

        return totalReward;
    }

    /**
     * @notice Get list of liquidatable positions
     * @dev Scans through positions to find liquidatable ones
     */
    function getLiquidatablePositions(uint256 maxCount)
        external
        view
        override
        returns (uint256[] memory positionIds)
    {
        uint256[] memory temp = new uint256[](maxCount);
        uint256 count = 0;

        // Scan through positions (in production, use an indexer)
        uint256 totalPositions = positionManager.positionCounter();

        for (uint256 i = 0; i < totalPositions && count < maxCount; i++) {
            (bool isLiquidatable, ) = checkLiquidation(i);

            if (isLiquidatable) {
                temp[count] = i;
                count++;
            }
        }

        // Create result array with actual size
        positionIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            positionIds[i] = temp[i];
        }

        return positionIds;
    }

    /**
     * @notice Pause/unpause liquidations (emergency only)
     */
    function setPaused(bool _isPaused) external onlyOwner {
        isPaused = _isPaused;
        emit LiquidationPauseChanged(_isPaused);
    }

    /**
     * @notice Calculate PnL for a position
     * @dev Internal helper function
     */
    function _calculatePnL(
        uint256 size,
        uint256 entryPrice,
        uint256 currentPrice,
        bool isLong
    ) internal pure returns (int256 pnl) {
        if (isLong) {
            // Long: profit if price increases
            pnl = int256((currentPrice - entryPrice) * size / 1e8);
        } else {
            // Short: profit if price decreases
            pnl = int256((entryPrice - currentPrice) * size / 1e8);
        }

        return pnl;
    }

    /**
     * @notice Update position manager address
     */
    function setPositionManager(address _newManager) external onlyOwner {
        require(_newManager != address(0), "Invalid address");
        positionManager = SimplePositionManager(_newManager);
    }

    /**
     * @notice Update oracle address
     */
    function setPriceOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid address");
        priceOracle = ChainlinkPriceOracle(_newOracle);
    }
}
