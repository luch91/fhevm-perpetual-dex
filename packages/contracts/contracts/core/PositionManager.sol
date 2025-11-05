// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "../interfaces/IPositionManager.sol";
import "../utils/ACLManager.sol";
import "../oracles/PriceOracle.sol";
import "../libraries/PnLCalculator.sol";

/**
 * @title PositionManager
 * @notice Manages encrypted trading positions for the perpetual DEX
 * @dev Uses fhEVM for privacy-preserving position management
 */
contract PositionManager is IPositionManager, ACLManager {
    // External contracts
    PriceOracle public priceOracle;

    // Position storage
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public traderPositions;

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
    event PriceOracleUpdated(address indexed newOracle);
    event LiquidationPriceCalculated(uint256 indexed positionId, uint256 liquidationPrice);

    constructor(address _priceOracle) {
        require(_priceOracle != address(0), "Invalid oracle address");
        priceOracle = PriceOracle(_priceOracle);
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

    modifier onlyPositionOwner(uint256 positionId) {
        require(positions[positionId].isOpen, "PositionManager: position not open");
        bool isOwner = false;
        uint256[] memory userPositions = traderPositions[msg.sender];
        for (uint256 i = 0; i < userPositions.length; i++) {
            if (userPositions[i] == positionId) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "PositionManager: not position owner");
        _;
    }

    /**
     * @notice Open a new trading position with encrypted size and collateral
     * @param encryptedSize Encrypted input for position size
     * @param inputProof Proof for encrypted size
     * @param encryptedCollateral Encrypted input for collateral amount
     * @param collateralProof Proof for encrypted collateral
     * @param isLong True for long position, false for short
     * @param leverage Leverage multiplier (1-10)
     * @return positionId The ID of the newly created position
     */
    function openPosition(
        einput encryptedSize,
        bytes calldata inputProof,
        einput encryptedCollateral,
        bytes calldata collateralProof,
        bool isLong,
        uint256 leverage
    ) external returns (uint256 positionId) {
        // Validate leverage
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");

        // Convert encrypted inputs to euint64
        euint64 size = TFHE.asEuint64(encryptedSize, inputProof);
        euint64 collateral = TFHE.asEuint64(encryptedCollateral, collateralProof);

        // Validate inputs (check they're not zero)
        ebool sizeValid = TFHE.ne(size, TFHE.asEuint64(0));
        ebool collateralValid = TFHE.ne(collateral, TFHE.asEuint64(0));

        // Get current price from oracle
        (uint256 currentPrice, , uint256 timestamp) = priceOracle.getPrice(DEFAULT_ASSET);
        require(priceOracle.isPriceFresh(DEFAULT_ASSET), "Price is stale");

        positionId = positionCounter++;

        // Create position with encrypted data
        positions[positionId] = Position({
            size: size,
            collateral: collateral,
            entryPrice: currentPrice,
            leverage: leverage,
            timestamp: block.timestamp,
            isLong: isLong,
            isOpen: true
        });

        // Grant access to encrypted data
        TFHE.allow(size, msg.sender);
        TFHE.allow(size, address(this));
        TFHE.allow(collateral, msg.sender);
        TFHE.allow(collateral, address(this));

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
        Position storage position = positions[positionId];

        require(position.isOpen, "PositionManager: position already closed");

        // Get current price from oracle
        (uint256 currentPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);
        require(priceOracle.isPriceFresh(DEFAULT_ASSET), "Price is stale");

        // Calculate PnL using PnLCalculator library
        euint64 pnl;
        if (position.isLong) {
            pnl = PnLCalculator.calculateLongPnL(
                position.size,
                position.entryPrice,
                currentPrice
            );
        } else {
            pnl = PnLCalculator.calculateShortPnL(
                position.size,
                position.entryPrice,
                currentPrice
            );
        }

        // Grant PnL access to position owner
        TFHE.allow(pnl, msg.sender);
        TFHE.allow(pnl, address(this));

        // Mark position as closed
        position.isOpen = false;

        emit PositionClosed(
            msg.sender,
            positionId,
            currentPrice,
            block.timestamp
        );
    }

    /**
     * @notice Get position details
     * @param positionId The ID of the position
     * @return Position struct (encrypted fields only accessible by authorized addresses)
     */
    function getPosition(uint256 positionId) external view returns (Position memory) {
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

    /**
     * @notice Get encrypted size for a position (only owner can decrypt)
     * @param positionId The ID of the position
     * @return Encrypted size value
     */
    function getEncryptedSize(uint256 positionId) external view returns (euint64) {
        return positions[positionId].size;
    }

    /**
     * @notice Get encrypted collateral for a position (only owner can decrypt)
     * @param positionId The ID of the position
     * @return Encrypted collateral value
     */
    function getEncryptedCollateral(uint256 positionId) external view returns (euint64) {
        return positions[positionId].collateral;
    }

    /**
     * @notice Calculate current unrealized PnL for a position
     * @param positionId The ID of the position
     * @return Encrypted PnL value
     */
    function calculatePositionPnL(uint256 positionId) external returns (euint64) {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position is closed");

        // Get current price
        (uint256 currentPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);

        // Calculate PnL based on position type
        if (position.isLong) {
            return PnLCalculator.calculateLongPnL(
                position.size,
                position.entryPrice,
                currentPrice
            );
        } else {
            return PnLCalculator.calculateShortPnL(
                position.size,
                position.entryPrice,
                currentPrice
            );
        }
    }

    /**
     * @notice Check if position is currently profitable
     * @param positionId The ID of the position
     * @return bool indicating if position is in profit
     */
    function isPositionProfitable(uint256 positionId) external view returns (bool) {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position is closed");

        // Get current price
        (uint256 currentPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);

        return PnLCalculator.isPositionProfitable(
            position.isLong,
            position.entryPrice,
            currentPrice
        );
    }

    /**
     * @notice Calculate current liquidation price for a position
     * @param positionId The ID of the position
     * @return Liquidation price
     */
    function getLiquidationPrice(uint256 positionId) external view returns (uint256) {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position is closed");

        if (position.isLong) {
            return PnLCalculator.calculateLongLiquidationPrice(
                position.entryPrice,
                position.leverage,
                MAINTENANCE_MARGIN_BPS
            );
        } else {
            return PnLCalculator.calculateShortLiquidationPrice(
                position.entryPrice,
                position.leverage,
                MAINTENANCE_MARGIN_BPS
            );
        }
    }

    /**
     * @notice Calculate position value at current price
     * @param positionId The ID of the position
     * @return Encrypted position value
     */
    function getPositionValue(uint256 positionId) external returns (euint64) {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position is closed");

        // Get current price
        (uint256 currentPrice, , ) = priceOracle.getPrice(DEFAULT_ASSET);

        return PnLCalculator.calculatePositionValue(position.size, currentPrice);
    }
}
