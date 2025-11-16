// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPerpetualDEX.sol";

/**
 * @title PerpetualDEX
 * @notice Main entry point for the fhEVM Perpetual DEX
 * @dev Coordinates all protocol components
 */
contract PerpetualDEX is IPerpetualDEX {
    address public override positionManager;
    address public owner;
    bool public override isPaused;

    modifier onlyOwner() {
        require(msg.sender == owner, "PerpetualDEX: caller is not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "PerpetualDEX: protocol is paused");
        _;
    }

    constructor(address _positionManager) {
        require(_positionManager != address(0), "PerpetualDEX: zero address");
        owner = msg.sender;
        positionManager = _positionManager;
        isPaused = false;
    }

    /**
     * @notice Update the position manager contract
     * @param _positionManager New position manager address
     */
    function setPositionManager(address _positionManager) external onlyOwner {
        require(_positionManager != address(0), "PerpetualDEX: zero address");
        positionManager = _positionManager;
        emit PositionManagerUpdated(_positionManager);
    }

    /**
     * @notice Pause the protocol
     */
    function pause() external override onlyOwner {
        isPaused = true;
        emit ProtocolPaused();
    }

    /**
     * @notice Unpause the protocol
     */
    function unpause() external override onlyOwner {
        isPaused = false;
        emit ProtocolUnpaused();
    }

    /**
     * @notice Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PerpetualDEX: zero address");
        owner = newOwner;
    }
}
