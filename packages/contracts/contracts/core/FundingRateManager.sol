// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IFundingRateManager.sol";

/**
 * @title FundingRateManager
 * @notice Manages funding rates for perpetual futures contracts
 * @dev Funding rates are calculated based on the imbalance between long and short positions
 *      Positive rate = longs pay shorts, Negative rate = shorts pay longs
 */
contract FundingRateManager is IFundingRateManager, Ownable {
    // Funding rate data per asset
    struct FundingData {
        int256 fundingRate; // Current funding rate in basis points (1 bps = 0.01%)
        uint256 lastUpdateTime; // Last time rate was updated
    }

    // Mapping from asset hash to funding data
    mapping(bytes32 => FundingData) public fundingData;

    // Funding interval (how often funding is applied) - default 8 hours
    uint256 public constant FUNDING_INTERVAL = 8 hours;

    // Maximum funding rate per interval: 0.1% (10 basis points)
    int256 public constant MAX_FUNDING_RATE = 10;

    // Minimum funding rate per interval: -0.1% (-10 basis points)
    int256 public constant MIN_FUNDING_RATE = -10;

    // Basis points divisor (10000 = 100%)
    uint256 public constant BPS_DIVISOR = 10000;

    // Common asset hashes
    bytes32 public constant BTC_USD = keccak256("BTC/USD");
    bytes32 public constant ETH_USD = keccak256("ETH/USD");
    bytes32 public constant SOL_USD = keccak256("SOL/USD");

    constructor() Ownable(msg.sender) {
        // Initialize with zero funding rates
        fundingData[BTC_USD] = FundingData({
            fundingRate: 0,
            lastUpdateTime: block.timestamp
        });
        fundingData[ETH_USD] = FundingData({
            fundingRate: 0,
            lastUpdateTime: block.timestamp
        });
        fundingData[SOL_USD] = FundingData({
            fundingRate: 0,
            lastUpdateTime: block.timestamp
        });
    }

    /**
     * @notice Get the current funding rate for an asset
     */
    function getFundingRate(string memory asset)
        external
        view
        override
        returns (int256 fundingRate, uint256 lastUpdateTime)
    {
        bytes32 assetHash = keccak256(bytes(asset));
        FundingData memory data = fundingData[assetHash];
        return (data.fundingRate, data.lastUpdateTime);
    }

    /**
     * @notice Calculate funding payment for a position
     * @dev Formula: payment = positionSize * fundingRate * (timeElapsed / FUNDING_INTERVAL) / BPS_DIVISOR
     *      Longs pay when rate is positive, shorts pay when rate is negative
     */
    function calculateFundingPayment(
        string memory asset,
        uint256 positionSize,
        bool isLong,
        uint256 lastFundingTime
    ) external view override returns (int256 fundingPayment) {
        bytes32 assetHash = keccak256(bytes(asset));
        FundingData memory data = fundingData[assetHash];

        // Calculate time elapsed since last funding
        uint256 timeElapsed = block.timestamp - lastFundingTime;
        if (timeElapsed == 0) return 0;

        // Calculate number of funding periods elapsed
        uint256 periods = timeElapsed / FUNDING_INTERVAL;
        if (periods == 0) return 0;

        // Calculate funding payment
        // payment = size * rate * periods / BPS_DIVISOR
        int256 payment = int256(positionSize) * data.fundingRate * int256(periods) / int256(BPS_DIVISOR);

        // Longs pay when rate is positive (imbalance favoring longs)
        // Shorts pay when rate is negative (imbalance favoring shorts)
        if (isLong) {
            return -payment; // Negative = position pays
        } else {
            return payment; // Positive = position receives
        }
    }

    /**
     * @notice Update funding rate based on open interest imbalance
     * @dev Rate = (longOI - shortOI) / (longOI + shortOI) * MAX_RATE
     *      Capped at +/- MAX_FUNDING_RATE
     */
    function updateFundingRate(
        string memory asset,
        uint256 longOpenInterest,
        uint256 shortOpenInterest
    ) external override onlyOwner {
        bytes32 assetHash = keccak256(bytes(asset));

        int256 newRate = 0;
        uint256 totalOpenInterest = longOpenInterest + shortOpenInterest;

        if (totalOpenInterest > 0) {
            // Calculate imbalance ratio
            // If more longs: positive rate (longs pay shorts)
            // If more shorts: negative rate (shorts pay longs)
            int256 imbalance = int256(longOpenInterest) - int256(shortOpenInterest);

            // Rate proportional to imbalance
            // Scale by MAX_FUNDING_RATE
            newRate = (imbalance * MAX_FUNDING_RATE) / int256(totalOpenInterest);

            // Cap the rate
            if (newRate > MAX_FUNDING_RATE) {
                newRate = MAX_FUNDING_RATE;
            } else if (newRate < MIN_FUNDING_RATE) {
                newRate = MIN_FUNDING_RATE;
            }
        }

        fundingData[assetHash] = FundingData({
            fundingRate: newRate,
            lastUpdateTime: block.timestamp
        });

        emit FundingRateUpdated(assetHash, newRate, block.timestamp);
    }

    /**
     * @notice Get asset hash for a symbol
     */
    function getAssetHash(string memory asset) external pure returns (bytes32) {
        return keccak256(bytes(asset));
    }
}
