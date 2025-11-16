// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainlinkPriceOracle
 * @notice Integrates Chainlink price feeds for real-time price data
 * @dev Phase 4: Real-time price feeds from Chainlink on Sepolia testnet
 */

// Chainlink AggregatorV3Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function version() external view returns (uint256);

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract ChainlinkPriceOracle is Ownable {
    // Price feed structure
    struct PriceFeed {
        address feedAddress;
        uint8 decimals;
        string description;
        bool isActive;
    }

    // Mapping from asset symbol hash to price feed
    mapping(bytes32 => PriceFeed) public priceFeeds;

    // Staleness threshold (1 hour)
    uint256 public constant STALENESS_THRESHOLD = 1 hours;

    // Events
    event PriceFeedAdded(bytes32 indexed asset, address feedAddress, string description);
    event PriceFeedUpdated(bytes32 indexed asset, address feedAddress);
    event PriceFeedRemoved(bytes32 indexed asset);

    // Common asset hashes
    bytes32 public constant BTC_USD = keccak256("BTC/USD");
    bytes32 public constant ETH_USD = keccak256("ETH/USD");
    bytes32 public constant SOL_USD = keccak256("SOL/USD");

    constructor() Ownable(msg.sender) {
        // Initialize Sepolia testnet price feeds
        _addPriceFeed(
            "BTC/USD",
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43, // BTC/USD on Sepolia
            "BTC / USD"
        );

        _addPriceFeed(
            "ETH/USD",
            0x694AA1769357215DE4FAC081bf1f309aDC325306, // ETH/USD on Sepolia
            "ETH / USD"
        );
    }

    /**
     * @notice Add a new price feed
     * @param asset Asset symbol (e.g., "BTC/USD")
     * @param feedAddress Chainlink price feed contract address
     * @param description Human-readable description
     */
    function addPriceFeed(
        string memory asset,
        address feedAddress,
        string memory description
    ) external onlyOwner {
        _addPriceFeed(asset, feedAddress, description);
    }

    /**
     * @notice Internal function to add price feed
     */
    function _addPriceFeed(
        string memory asset,
        address feedAddress,
        string memory description
    ) internal {
        require(feedAddress != address(0), "Invalid feed address");

        bytes32 assetHash = keccak256(bytes(asset));
        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);

        priceFeeds[assetHash] = PriceFeed({
            feedAddress: feedAddress,
            decimals: feed.decimals(),
            description: description,
            isActive: true
        });

        emit PriceFeedAdded(assetHash, feedAddress, description);
    }

    /**
     * @notice Update price feed address
     * @param asset Asset symbol
     * @param newFeedAddress New Chainlink feed address
     */
    function updatePriceFeed(string memory asset, address newFeedAddress)
        external
        onlyOwner
    {
        require(newFeedAddress != address(0), "Invalid feed address");

        bytes32 assetHash = keccak256(bytes(asset));
        require(priceFeeds[assetHash].feedAddress != address(0), "Price feed not found");

        AggregatorV3Interface feed = AggregatorV3Interface(newFeedAddress);

        priceFeeds[assetHash].feedAddress = newFeedAddress;
        priceFeeds[assetHash].decimals = feed.decimals();

        emit PriceFeedUpdated(assetHash, newFeedAddress);
    }

    /**
     * @notice Deactivate a price feed
     * @param asset Asset symbol
     */
    function removePriceFeed(string memory asset) external onlyOwner {
        bytes32 assetHash = keccak256(bytes(asset));
        require(priceFeeds[assetHash].feedAddress != address(0), "Price feed not found");

        priceFeeds[assetHash].isActive = false;

        emit PriceFeedRemoved(assetHash);
    }

    /**
     * @notice Get latest price from Chainlink
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
        return getPriceByHash(assetHash);
    }

    /**
     * @notice Get price by hash (gas efficient)
     * @param assetHash Keccak256 hash of asset symbol
     */
    function getPriceByHash(bytes32 assetHash)
        public
        view
        returns (
            uint256 price,
            uint8 decimals,
            uint256 timestamp
        )
    {
        PriceFeed memory feed = priceFeeds[assetHash];
        require(feed.feedAddress != address(0), "Price feed not found");
        require(feed.isActive, "Price feed inactive");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed.feedAddress);

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price");
        require(answeredInRound >= roundId, "Stale price");
        require(updatedAt > 0, "Round not complete");

        return (uint256(answer), feed.decimals, updatedAt);
    }

    /**
     * @notice Check if price is fresh (within staleness threshold)
     * @param asset Asset symbol
     * @return bool indicating if price is fresh
     */
    function isPriceFresh(string memory asset) external view returns (bool) {
        bytes32 assetHash = keccak256(bytes(asset));
        PriceFeed memory feed = priceFeeds[assetHash];

        if (feed.feedAddress == address(0) || !feed.isActive) {
            return false;
        }

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed.feedAddress);

        (, , , uint256 updatedAt, ) = priceFeed.latestRoundData();

        if (updatedAt == 0) return false;

        return (block.timestamp - updatedAt) < STALENESS_THRESHOLD;
    }

    /**
     * @notice Get asset hash for a symbol
     * @param asset Asset symbol
     * @return bytes32 hash
     */
    function getAssetHash(string memory asset) external pure returns (bytes32) {
        return keccak256(bytes(asset));
    }

    /**
     * @notice Get price feed info
     * @param asset Asset symbol
     * @return feedAddress Chainlink feed contract address
     * @return decimals Price decimals
     * @return description Feed description
     * @return isActive Whether feed is active
     */
    function getPriceFeedInfo(string memory asset)
        external
        view
        returns (
            address feedAddress,
            uint8 decimals,
            string memory description,
            bool isActive
        )
    {
        bytes32 assetHash = keccak256(bytes(asset));
        PriceFeed memory feed = priceFeeds[assetHash];

        return (feed.feedAddress, feed.decimals, feed.description, feed.isActive);
    }

    /**
     * @notice Get multiple prices at once (batch read)
     * @param assets Array of asset symbols
     * @return prices Array of prices
     * @return timestamps Array of update timestamps
     */
    function getPrices(string[] memory assets)
        external
        view
        returns (uint256[] memory prices, uint256[] memory timestamps)
    {
        uint256 length = assets.length;
        prices = new uint256[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            (uint256 price, , uint256 timestamp) = this.getPrice(assets[i]);
            prices[i] = price;
            timestamps[i] = timestamp;
        }

        return (prices, timestamps);
    }
}
