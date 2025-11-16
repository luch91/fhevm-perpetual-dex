// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice DEPRECATED - This contract has been replaced by ChainlinkPriceOracle
 * @dev DO NOT USE FOR NEW DEPLOYMENTS
 *
 * **MIGRATION NOTICE:**
 * - This mock oracle was used in Phase 1-4 for testing
 * - Deployed at: 0xC201C14DFA83F659B32e4d625209c54cb9B7D120 (Sepolia)
 * - Replaced by: ChainlinkPriceOracle at 0x45328039a3F8a5502e34Ee9038b1649e33eF4600
 * - Migration Date: November 15, 2025 (Phase 6B)
 * - Use ChainlinkPriceOracle for all new deployments
 *
 * **WARNING:** This contract uses manually updated prices and is not suitable for production.
 * For decentralized, real-time price feeds, use ChainlinkPriceOracle instead.
 */
contract PriceOracle is Ownable {
    // Price data structure
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
    }

    // Mapping from asset symbol to price data
    mapping(bytes32 => PriceData) public prices;

    // Events
    event PriceUpdated(bytes32 indexed asset, uint256 price, uint256 timestamp);

    constructor() Ownable(msg.sender) {
        // Initialize with mock BTC price
        bytes32 btcSymbol = keccak256("BTC/USD");
        prices[btcSymbol] = PriceData({
            price: 45000e8, // $45,000 with 8 decimals
            timestamp: block.timestamp,
            decimals: 8
        });

        emit PriceUpdated(btcSymbol, 45000e8, block.timestamp);
    }

    /**
     * @notice Update price for an asset (owner only for now)
     * @param asset Asset symbol (e.g., "BTC/USD")
     * @param price New price with decimals
     * @param decimals Number of decimal places
     */
    function updatePrice(string memory asset, uint256 price, uint8 decimals)
        external
        onlyOwner
    {
        bytes32 assetHash = keccak256(bytes(asset));

        prices[assetHash] = PriceData({
            price: price,
            timestamp: block.timestamp,
            decimals: decimals
        });

        emit PriceUpdated(assetHash, price, block.timestamp);
    }

    /**
     * @notice Get latest price for an asset
     * @param asset Asset symbol
     * @return price Latest price
     * @return decimals Number of decimal places
     * @return timestamp When price was last updated
     */
    function getPrice(string memory asset)
        external
        view
        returns (
            uint256 price,
            uint8 decimals,
            uint256 timestamp
        )
    {
        bytes32 assetHash = keccak256(bytes(asset));
        PriceData memory data = prices[assetHash];

        require(data.timestamp > 0, "Price not available");

        return (data.price, data.decimals, data.timestamp);
    }

    /**
     * @notice Get price by hash (gas efficient)
     * @param assetHash Keccak256 hash of asset symbol
     */
    function getPriceByHash(bytes32 assetHash)
        external
        view
        returns (
            uint256 price,
            uint8 decimals,
            uint256 timestamp
        )
    {
        PriceData memory data = prices[assetHash];
        require(data.timestamp > 0, "Price not available");

        return (data.price, data.decimals, data.timestamp);
    }

    /**
     * @notice Check if price is fresh (within last 1 hour)
     * @param asset Asset symbol
     * @return bool indicating if price is fresh
     */
    function isPriceFresh(string memory asset) external view returns (bool) {
        bytes32 assetHash = keccak256(bytes(asset));
        PriceData memory data = prices[assetHash];

        if (data.timestamp == 0) return false;

        return (block.timestamp - data.timestamp) < 1 hours;
    }

    /**
     * @notice Get asset hash for a symbol
     * @param asset Asset symbol
     * @return bytes32 hash
     */
    function getAssetHash(string memory asset) external pure returns (bytes32) {
        return keccak256(bytes(asset));
    }

    // Common asset hashes for convenience
    bytes32 public constant BTC_USD = keccak256("BTC/USD");
    bytes32 public constant ETH_USD = keccak256("ETH/USD");
    bytes32 public constant SOL_USD = keccak256("SOL/USD");
}
