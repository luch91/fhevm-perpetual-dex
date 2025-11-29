// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFundingRateManager
 * @notice Interface for managing funding rates in perpetual futures
 * @dev Funding rates keep perpetual prices aligned with spot prices
 */
interface IFundingRateManager {
    /**
     * @notice Get the current funding rate for an asset
     * @param asset Asset symbol (e.g., "BTC/USD")
     * @return fundingRate Current funding rate (positive = longs pay shorts)
     * @return lastUpdateTime When the rate was last updated
     */
    function getFundingRate(string memory asset)
        external
        view
        returns (int256 fundingRate, uint256 lastUpdateTime);

    /**
     * @notice Calculate funding payment for a position
     * @param asset Asset symbol
     * @param positionSize Size of the position
     * @param isLong Whether position is long
     * @param lastFundingTime When funding was last applied to this position
     * @return fundingPayment Amount to pay (positive = pay, negative = receive)
     */
    function calculateFundingPayment(
        string memory asset,
        uint256 positionSize,
        bool isLong,
        uint256 lastFundingTime
    ) external view returns (int256 fundingPayment);

    /**
     * @notice Update funding rate based on current open interest
     * @param asset Asset symbol
     * @param longOpenInterest Total long position size
     * @param shortOpenInterest Total short position size
     */
    function updateFundingRate(
        string memory asset,
        uint256 longOpenInterest,
        uint256 shortOpenInterest
    ) external;

    /**
     * @notice Emitted when funding rate is updated
     * @param asset Asset symbol
     * @param fundingRate New funding rate
     * @param timestamp When rate was updated
     */
    event FundingRateUpdated(
        bytes32 indexed asset,
        int256 fundingRate,
        uint256 timestamp
    );

    /**
     * @notice Emitted when funding is applied to a position
     * @param positionId Position ID
     * @param asset Asset symbol
     * @param fundingPayment Amount paid (positive) or received (negative)
     */
    event FundingApplied(
        uint256 indexed positionId,
        bytes32 indexed asset,
        int256 fundingPayment
    );
}
