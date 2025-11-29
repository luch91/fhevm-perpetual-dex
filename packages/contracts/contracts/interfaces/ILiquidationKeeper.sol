// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ILiquidationKeeper
 * @notice Interface for liquidation keeper functionality
 * @dev Monitors positions and liquidates undercollateralized positions
 */
interface ILiquidationKeeper {
    /**
     * @notice Check if a position is eligible for liquidation
     * @param positionId Position ID to check
     * @return isLiquidatable Whether position can be liquidated
     * @return currentCollateralRatio Current collateral ratio in basis points
     */
    function checkLiquidation(uint256 positionId)
        external
        view
        returns (bool isLiquidatable, uint256 currentCollateralRatio);

    /**
     * @notice Liquidate an undercollateralized position
     * @param positionId Position ID to liquidate
     * @return liquidationReward Reward paid to liquidator
     */
    function liquidatePosition(uint256 positionId)
        external
        returns (uint256 liquidationReward);

    /**
     * @notice Batch liquidate multiple positions
     * @param positionIds Array of position IDs
     * @return totalReward Total reward paid for all liquidations
     */
    function batchLiquidate(uint256[] calldata positionIds)
        external
        returns (uint256 totalReward);

    /**
     * @notice Get list of liquidatable positions
     * @param maxCount Maximum number of positions to return
     * @return positionIds Array of liquidatable position IDs
     */
    function getLiquidatablePositions(uint256 maxCount)
        external
        view
        returns (uint256[] memory positionIds);

    /**
     * @notice Emitted when a position is liquidated
     * @param positionId Position that was liquidated
     * @param liquidator Address that performed liquidation
     * @param reward Reward paid to liquidator
     * @param timestamp When liquidation occurred
     */
    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 reward,
        uint256 timestamp
    );

    /**
     * @notice Emitted when liquidation is paused/unpaused
     * @param isPaused New pause status
     */
    event LiquidationPauseChanged(bool isPaused);
}
