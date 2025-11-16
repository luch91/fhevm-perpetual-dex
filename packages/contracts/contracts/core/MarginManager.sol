// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "../utils/ACLManager.sol";

/**
 * @title MarginManager
 * @notice Manages collateral and margin requirements for leveraged positions
 * @dev Uses fhEVM for privacy-preserving collateral tracking
 */
contract MarginManager is ACLManager {
    // Margin configuration
    uint256 public constant MIN_LEVERAGE = 1; // 1x (no leverage)
    uint256 public constant MAX_LEVERAGE = 10; // 10x maximum
    uint256 public constant INITIAL_MARGIN_BPS = 1000; // 10% (basis points)
    uint256 public constant MAINTENANCE_MARGIN_BPS = 500; // 5%
    uint256 public constant BPS_DIVISOR = 10000;

    // User collateral balances (encrypted)
    mapping(address => euint64) public encryptedCollateral;

    // Events
    event CollateralDeposited(address indexed user, bytes encryptedAmount);
    event CollateralWithdrawn(address indexed user, bytes encryptedAmount);
    event MarginCall(address indexed user, uint256 positionId);

    /**
     * @notice Deposit collateral for trading (plaintext input, encrypted on-chain)
     * @param amount Collateral amount to deposit
     */
    function depositCollateral(uint64 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Convert plaintext to encrypted
        euint64 encryptedAmount = FHE.asEuint64(amount);

        // Add to user's collateral balance
        euint64 currentBalance = encryptedCollateral[msg.sender];
        if (FHE.isInitialized(currentBalance)) {
            encryptedCollateral[msg.sender] = FHE.add(currentBalance, encryptedAmount);
        } else {
            encryptedCollateral[msg.sender] = encryptedAmount;
        }

        // Grant access to the user
        FHE.allow(encryptedCollateral[msg.sender], address(this));
        FHE.allow(encryptedCollateral[msg.sender], msg.sender);

        // Note: Event emission with encrypted data requires proper reencryption handling
        emit CollateralDeposited(msg.sender, "");
    }

    /**
     * @notice Withdraw collateral (must have no open positions or sufficient margin)
     * @param amount Amount to withdraw
     */
    function withdrawCollateral(uint64 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        euint64 encryptedAmount = FHE.asEuint64(amount);
        euint64 currentBalance = encryptedCollateral[msg.sender];

        // Subtract from balance
        encryptedCollateral[msg.sender] = FHE.sub(currentBalance, encryptedAmount);

        // Grant access
        FHE.allow(encryptedCollateral[msg.sender], address(this));
        FHE.allow(encryptedCollateral[msg.sender], msg.sender);

        // Note: Event emission with encrypted data requires proper reencryption handling
        emit CollateralWithdrawn(msg.sender, "");

        // Note: In production, transfer the actual collateral tokens here
        // payable(msg.sender).transfer(amount);
    }

    /**
     * @notice Get user's encrypted collateral balance
     * @param user Address of the user
     * @return Encrypted collateral balance
     */
    function getEncryptedCollateral(address user) external view returns (euint64) {
        return encryptedCollateral[user];
    }

    /**
     * @notice Calculate required initial margin for a position
     * @param positionSize Size of the position in base currency
     * @param leverage Leverage multiplier (1-10)
     * @return Required initial margin amount
     */
    function calculateInitialMargin(uint256 positionSize, uint256 leverage)
        public
        pure
        returns (uint256)
    {
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");

        // Initial margin = position size / leverage * initial margin %
        // For 10x leverage: need 10% of position size as collateral
        return (positionSize * INITIAL_MARGIN_BPS) / (leverage * BPS_DIVISOR);
    }

    /**
     * @notice Calculate maintenance margin for a position
     * @param positionSize Size of the position
     * @param leverage Leverage multiplier
     * @return Required maintenance margin amount
     */
    function calculateMaintenanceMargin(uint256 positionSize, uint256 leverage)
        public
        pure
        returns (uint256)
    {
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");

        // Maintenance margin = position size / leverage * maintenance margin %
        return (positionSize * MAINTENANCE_MARGIN_BPS) / (leverage * BPS_DIVISOR);
    }

    /**
     * @notice Check if position meets margin requirements (encrypted version)
     * @param encryptedCollateralAmount Encrypted collateral amount
     * @param positionSize Position size in base currency
     * @param leverage Leverage multiplier
     * @return ebool indicating if margin is sufficient
     */
    function checkMarginRequirement(
        euint64 encryptedCollateralAmount,
        uint256 positionSize,
        uint256 leverage
    ) public returns (ebool) {
        uint256 requiredMargin = calculateInitialMargin(positionSize, leverage);
        require(requiredMargin <= type(uint64).max, "Required margin exceeds uint64");
        euint64 encryptedRequired = FHE.asEuint64(uint64(requiredMargin));

        return FHE.ge(encryptedCollateralAmount, encryptedRequired);
    }

    /**
     * @notice Calculate position health factor
     * @dev Health factor = collateral / maintenance margin
     * @dev Health factor < 1.0 means position is undercollateralized
     * @param encryptedCollateralAmount Encrypted collateral
     * @param positionSize Position size
     * @param leverage Leverage used
     * @return ebool indicating if position is healthy (above maintenance margin)
     */
    function isPositionHealthy(
        euint64 encryptedCollateralAmount,
        uint256 positionSize,
        uint256 leverage
    ) public returns (ebool) {
        uint256 maintenanceMargin = calculateMaintenanceMargin(positionSize, leverage);
        require(maintenanceMargin <= type(uint64).max, "Maintenance margin exceeds uint64");
        euint64 encryptedMaintenance = FHE.asEuint64(uint64(maintenanceMargin));

        return FHE.ge(encryptedCollateralAmount, encryptedMaintenance);
    }

    /**
     * @notice Get maximum position size based on collateral and leverage
     * @param encryptedCollateralAmount Encrypted collateral
     * @param leverage Desired leverage
     * @return Maximum position size (encrypted)
     */
    function getMaxPositionSize(euint64 encryptedCollateralAmount, uint256 leverage)
        public
        returns (euint64)
    {
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");

        // Max position size = collateral * leverage
        euint64 leverageEncrypted = FHE.asEuint64(uint64(leverage));
        return FHE.mul(encryptedCollateralAmount, leverageEncrypted);
    }
}
