// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ACLManager
 * @notice Manages Access Control Lists for encrypted data in fhEVM
 * @dev Handles permissions for who can access encrypted position data
 */
contract ACLManager {
    // Mapping to track authorized contracts
    mapping(address => bool) public authorizedContracts;

    address public owner;

    event ContractAuthorized(address indexed contractAddress);
    event ContractRevoked(address indexed contractAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "ACLManager: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Authorize a contract to access encrypted data
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "ACLManager: zero address");
        authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    /**
     * @notice Revoke contract authorization
     * @param contractAddress Address of the contract to revoke
     */
    function revokeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit ContractRevoked(contractAddress);
    }

    /**
     * @notice Allow a user to access their own encrypted data
     * @param encryptedValue The encrypted value to grant access to
     * @param user Address of the user
     */
    function allowUser(euint64 encryptedValue, address user) internal {
        FHE.allow(encryptedValue, user);
    }

    /**
     * @notice Allow a contract to access encrypted data
     * @param encryptedValue The encrypted value to grant access to
     * @param contractAddress Address of the contract
     */
    function allowContract(euint64 encryptedValue, address contractAddress) internal {
        require(authorizedContracts[contractAddress], "ACLManager: contract not authorized");
        FHE.allow(encryptedValue, contractAddress);
    }

    /**
     * @notice Allow both user and contract to access encrypted data
     * @param encryptedValue The encrypted value to grant access to
     * @param user Address of the user
     * @param contractAddress Address of the contract
     */
    function allowUserAndContract(
        euint64 encryptedValue,
        address user,
        address contractAddress
    ) internal {
        FHE.allow(encryptedValue, user);
        if (authorizedContracts[contractAddress]) {
            FHE.allow(encryptedValue, contractAddress);
        }
    }
}
