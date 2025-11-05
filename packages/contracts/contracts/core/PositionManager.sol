// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "../interfaces/IPositionManager.sol";
import "../utils/ACLManager.sol";

/**
 * @title PositionManager
 * @notice Manages encrypted trading positions for the perpetual DEX
 * @dev Uses fhEVM for privacy-preserving position management
 */
contract PositionManager is IPositionManager, ACLManager {
    // Position storage
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public traderPositions;

    uint256 public positionCounter;
    uint256 public constant MOCK_PRICE = 2000e8; // Mock BTC price: $2000 (with 8 decimals)

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
     * @return positionId The ID of the newly created position
     */
    function openPosition(
        einput encryptedSize,
        bytes calldata inputProof,
        einput encryptedCollateral,
        bytes calldata collateralProof,
        bool isLong
    ) external returns (uint256 positionId) {
        // Convert encrypted inputs to euint64
        euint64 size = TFHE.asEuint64(encryptedSize, inputProof);
        euint64 collateral = TFHE.asEuint64(encryptedCollateral, collateralProof);

        // Validate inputs (check they're not zero)
        ebool sizeValid = TFHE.ne(size, TFHE.asEuint64(0));
        ebool collateralValid = TFHE.ne(collateral, TFHE.asEuint64(0));

        // Note: In production, you'd decrypt these for validation or use other methods
        // For now, we'll proceed assuming valid inputs

        positionId = positionCounter++;

        // Create position with encrypted data
        positions[positionId] = Position({
            size: size,
            collateral: collateral,
            entryPrice: MOCK_PRICE, // Using mock price for Phase 1
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

        emit PositionOpened(
            msg.sender,
            positionId,
            isLong,
            MOCK_PRICE,
            block.timestamp
        );

        return positionId;
    }

    /**
     * @notice Close an existing position
     * @param positionId The ID of the position to close
     */
    function closePosition(uint256 positionId) external onlyPositionOwner(positionId) {
        Position storage position = positions[positionId];

        require(position.isOpen, "PositionManager: position already closed");

        // Mark position as closed
        position.isOpen = false;

        // In Phase 2, we'll calculate PnL here
        // For now, just emit the event
        emit PositionClosed(
            msg.sender,
            positionId,
            MOCK_PRICE, // Using mock price as exit price
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
}
