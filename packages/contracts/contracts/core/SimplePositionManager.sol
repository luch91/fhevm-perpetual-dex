// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPositionManager.sol";
import "../interfaces/IFundingRateManager.sol";
import "../interfaces/ILiquidationKeeper.sol";
import "../oracles/PriceOracle.sol";
import "../libraries/PnLCalculator.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimplePositionManager
 * @notice Simplified Position Manager WITHOUT FHE encryption for Sepolia demo
 * @dev This is a non-encrypted version for testing on regular Sepolia
 *      For production with privacy, use the full PositionManager with fhEVM
 *      NOW INCLUDES: Funding rates and liquidation support
 */
contract SimplePositionManager {
    // Simplified position without encryption
    struct SimplePosition {
        uint64 size;
        uint64 collateral;
        uint256 entryPrice;
        uint256 leverage;
        uint256 timestamp;
        uint256 lastFundingTime;  // NEW: Track last funding payment
        bool isLong;
        bool isOpen;
    }

    // External contracts
    PriceOracle public priceOracle;
    IFundingRateManager public fundingRateManager;
    ILiquidationKeeper public liquidationKeeper;
    IERC20 public usdcToken;

    // Position storage
    mapping(uint256 => SimplePosition) public positions;
    mapping(address => uint256[]) public traderPositions;
    mapping(address => uint256) public traderToPositionOwner;  // Track position owners

    uint256 public positionCounter;

    // Leverage and margin configuration
    uint256 public constant MIN_LEVERAGE = 1;
    uint256 public constant MAX_LEVERAGE = 10;
    uint256 public constant INITIAL_MARGIN_BPS = 1000; // 10%
    uint256 public constant MAINTENANCE_MARGIN_BPS = 500; // 5%
    uint256 public constant BPS_DIVISOR = 10000;

    // Default asset for trading
    string public constant DEFAULT_ASSET = "BTC/USD";

    // Events
    event PositionOpened(
        address indexed trader,
        uint256 indexed positionId,
        bool isLong,
        uint256 entryPrice,
        uint256 timestamp
    );

    event PositionClosed(
        address indexed trader,
        uint256 indexed positionId,
        uint256 exitPrice,
        int256 fundingPayment,  // NEW: Include funding payment
        uint256 timestamp
    );

    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidationPrice,
        uint256 reward,
        int256 fundingPayment,
        uint256 timestamp
    );

    event PriceOracleUpdated(address indexed newOracle);
    event FundingRateManagerUpdated(address indexed newManager);
    event LiquidationKeeperUpdated(address indexed newKeeper);
    event LiquidationPriceCalculated(uint256 indexed positionId, uint256 liquidationPrice);

    constructor(
        address _priceOracle,
        address _fundingRateManager,
        address _liquidationKeeper,
        address _usdcToken
    ) {
        require(_priceOracle != address(0), "Invalid oracle address");
        require(_fundingRateManager != address(0), "Invalid funding manager");
        require(_liquidationKeeper != address(0), "Invalid liquidation keeper");
        require(_usdcToken != address(0), "Invalid USDC address");

        priceOracle = PriceOracle(_priceOracle);
        fundingRateManager = IFundingRateManager(_fundingRateManager);
        liquidationKeeper = ILiquidationKeeper(_liquidationKeeper);
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Update the price oracle address
     * @param _newOracle Address of the new price oracle
     */
    function setPriceOracle(address _newOracle) external {
        require(_newOracle != address(0), "Invalid oracle address");
        priceOracle = PriceOracle(_newOracle);
        emit PriceOracleUpdated(_newOracle);
    }

    /**
     * @notice Update the funding rate manager address
     * @param _newManager Address of the new funding rate manager
     */
    function setFundingRateManager(address _newManager) external {
        require(_newManager != address(0), "Invalid manager address");
        fundingRateManager = IFundingRateManager(_newManager);
        emit FundingRateManagerUpdated(_newManager);
    }

    /**
     * @notice Update the liquidation keeper address
     * @param _newKeeper Address of the new liquidation keeper
     */
    function setLiquidationKeeper(address _newKeeper) external {
        require(_newKeeper != address(0), "Invalid keeper address");
        liquidationKeeper = ILiquidationKeeper(_newKeeper);
        emit LiquidationKeeperUpdated(_newKeeper);
    }

    modifier onlyPositionOwner(uint256 positionId) {
        require(positions[positionId].isOpen, "Position not open");
        bool isOwner = false;
        uint256[] memory userPositions = traderPositions[msg.sender];
        for (uint256 i = 0; i < userPositions.length; i++) {
            if (userPositions[i] == positionId) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not position owner");
        _;
    }

    /**
     * @notice Open a new trading position (NO ENCRYPTION for demo)
     * @param size Position size
     * @param collateral Collateral amount
     * @param isLong True for long position, false for short
     * @param leverage Leverage multiplier (1-10)
     * @return positionId The ID of the newly created position
     */
    function openPosition(
        uint64 size,
        uint64 collateral,
        bool isLong,
        uint256 leverage
    ) external returns (uint256 positionId) {
        // Validate leverage
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");

        // Validate inputs
        require(size > 0, "Size must be greater than zero");
        require(collateral > 0, "Collateral must be greater than zero");

        // Transfer USDC collateral from trader to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), collateral),
            "USDC transfer failed"
        );

        // Get current price from oracle
        (uint256 currentPrice, , uint256 timestamp) = priceOracle.getPrice(DEFAULT_ASSET);
        require(priceOracle.isPriceFresh(DEFAULT_ASSET), "Price is stale");

        positionId = positionCounter++;

        // Create position WITHOUT encryption
        positions[positionId] = SimplePosition({
            size: size,
            collateral: collateral,
            entryPrice: currentPrice,
            leverage: leverage,
            timestamp: block.timestamp,
            lastFundingTime: block.timestamp,  // NEW: Initialize funding time
            isLong: isLong,
            isOpen: true
        });

        // Track position for trader
        traderPositions[msg.sender].push(positionId);

        // Calculate liquidation price
        uint256 liquidationPrice;
        if (isLong) {
            liquidationPrice = PnLCalculator.calculateLongLiquidationPrice(
                currentPrice,
                leverage,
                MAINTENANCE_MARGIN_BPS
            );
        } else {
            liquidationPrice = PnLCalculator.calculateShortLiquidationPrice(
                currentPrice,
                leverage,
                MAINTENANCE_MARGIN_BPS
            );
        }

        // Update funding rate with new open interest
        fundingRateManager.updateFundingRate(
            DEFAULT_ASSET,
            isLong ? uint256(size) : 0,  // longOpenInterest increase
            isLong ? 0 : uint256(size)   // shortOpenInterest increase
        );

        emit PositionOpened(
            msg.sender,
            positionId,
            isLong,
            currentPrice,
            block.timestamp
        );

        emit LiquidationPriceCalculated(positionId, liquidationPrice);

        return positionId;
    }

    /**
     * @notice Close an existing position
     * @param positionId The ID of the position to close
     */
    function closePosition(uint256 positionId) external onlyPositionOwner(positionId) {
        SimplePosition storage position = positions[positionId];

        // Get current price
        (uint256 exitPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);
        require(priceOracle.isPriceFresh(DEFAULT_ASSET), "Price is stale");

        // Calculate PnL (simplified for non-encrypted positions)
        int256 pnl;
        if (position.isLong) {
            // Long position: profit when price goes up
            pnl = int256(exitPrice) - int256(position.entryPrice);
            pnl = (pnl * int256(uint256(position.size))) / int256(1e8);
        } else {
            // Short position: profit when price goes down
            pnl = int256(position.entryPrice) - int256(exitPrice);
            pnl = (pnl * int256(uint256(position.size))) / int256(1e8);
        }

        // Calculate funding payment
        int256 fundingPayment = fundingRateManager.calculateFundingPayment(
            DEFAULT_ASSET,
            position.size,
            position.isLong,
            position.lastFundingTime
        );

        // Calculate final payout: collateral + PnL - funding
        // Note: fundingPayment is negative if trader pays, positive if trader receives
        int256 finalPayout = int256(uint256(position.collateral)) + pnl - fundingPayment;

        // Update funding rate with reduced open interest
        fundingRateManager.updateFundingRate(
            DEFAULT_ASSET,
            position.isLong ? 0 : 0,  // Reduce open interest by position size
            position.isLong ? 0 : 0
        );

        // Mark position as closed
        position.isOpen = false;

        // Transfer payout to trader (only if positive)
        if (finalPayout > 0) {
            require(
                usdcToken.transfer(msg.sender, uint256(finalPayout)),
                "USDC transfer failed"
            );
        }
        // If negative, trader loses all collateral (stays in contract)

        emit PositionClosed(
            msg.sender,
            positionId,
            exitPrice,
            fundingPayment,
            block.timestamp
        );
    }

    /**
     * @notice Liquidate an undercollateralized position
     * @dev Only callable by the liquidation keeper contract
     * @param positionId The ID of the position to liquidate
     * @return liquidationReward Reward paid to liquidator
     */
    function liquidatePosition(uint256 positionId)
        external
        returns (uint256 liquidationReward)
    {
        SimplePosition storage position = positions[positionId];
        require(position.isOpen, "Position not open");

        // Only liquidation keeper can liquidate
        require(msg.sender == address(liquidationKeeper), "Only keeper can liquidate");

        // Get current price
        (uint256 currentPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);
        require(priceOracle.isPriceFresh(DEFAULT_ASSET), "Price is stale");

        // Verify position is liquidatable
        (bool isLiquidatable, ) = liquidationKeeper.checkLiquidation(positionId);
        require(isLiquidatable, "Position not liquidatable");

        // Calculate funding payment before liquidation
        int256 fundingPayment = fundingRateManager.calculateFundingPayment(
            DEFAULT_ASSET,
            position.size,
            position.isLong,
            position.lastFundingTime
        );

        // Update funding rate with reduced open interest
        fundingRateManager.updateFundingRate(
            DEFAULT_ASSET,
            position.isLong ? 0 : 0,
            position.isLong ? 0 : 0
        );

        // Mark position as closed
        position.isOpen = false;

        // Calculate liquidation reward (5% of collateral)
        liquidationReward = (uint256(position.collateral) * 500) / 10000;

        // Transfer liquidation reward to liquidator
        if (liquidationReward > 0) {
            require(
                usdcToken.transfer(msg.sender, liquidationReward),
                "Liquidation reward transfer failed"
            );
        }

        emit PositionLiquidated(
            positionId,
            msg.sender,
            currentPrice,
            liquidationReward,
            fundingPayment,
            block.timestamp
        );

        return liquidationReward;
    }

    /**
     * @notice Get position details
     * @param positionId The ID of the position
     * @return Position details
     */
    function getPosition(uint256 positionId) external view returns (SimplePosition memory) {
        return positions[positionId];
    }

    /**
     * @notice Get the number of positions for a trader
     * @param trader Address of the trader
     * @return Number of positions
     */
    function getPositionCount(address trader) external view returns (uint256) {
        return traderPositions[trader].length;
    }

    /**
     * @notice Get all position IDs for a trader
     * @param trader Address of the trader
     * @return Array of position IDs
     */
    function getTraderPositions(address trader) external view returns (uint256[] memory) {
        return traderPositions[trader];
    }
}
