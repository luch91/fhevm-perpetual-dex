// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

interface IPositionManager {
    struct Position {
        euint64 size;           // Position size (encrypted)
        euint64 collateral;     // Collateral amount (encrypted)
        uint256 entryPrice;     // Entry price (public, from oracle)
        uint256 timestamp;      // Position open timestamp
        bool isLong;            // Long or short (public)
        bool isOpen;            // Position status
    }

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
        uint256 timestamp
    );

    event CollateralAdded(
        address indexed trader,
        uint256 indexed positionId,
        uint256 timestamp
    );

    function openPosition(
        einput encryptedSize,
        bytes calldata inputProof,
        einput encryptedCollateral,
        bytes calldata collateralProof,
        bool isLong
    ) external returns (uint256 positionId);

    function closePosition(uint256 positionId) external;

    function getPosition(uint256 positionId) external view returns (Position memory);

    function getPositionCount(address trader) external view returns (uint256);
}
