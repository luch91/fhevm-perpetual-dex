// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing on Sepolia testnet
 * @dev Anyone can mint unlimited tokens for testing purposes
 *
 * Features:
 * - Public mint function (anyone can mint)
 * - 6 decimals (matches real USDC)
 * - Unlimited supply
 * - Perfect for testnet trading
 *
 * Usage:
 * 1. Deploy to Sepolia
 * 2. Call mint(yourAddress, amount * 1e6)
 * 3. Use as collateral in PositionManager
 */
contract MockUSDC is ERC20 {
    /**
     * @notice Constructor sets token name and symbol
     */
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint initial supply to deployer for convenience
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC to deployer
    }

    /**
     * @notice Mint tokens to any address
     * @param to Address to receive tokens
     * @param amount Amount to mint (in base units, e.g., 100 * 1e6 for 100 USDC)
     * @dev Public function - anyone can mint for testing
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @notice USDC uses 6 decimals
     * @return Number of decimals (6)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Helper function to mint with decimal conversion
     * @param to Address to receive tokens
     * @param amountInWholeTokens Amount in whole tokens (e.g., 100 for 100 USDC)
     * @dev Automatically converts to base units
     */
    function mintWithDecimals(address to, uint256 amountInWholeTokens) public {
        _mint(to, amountInWholeTokens * 10**6);
    }

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
