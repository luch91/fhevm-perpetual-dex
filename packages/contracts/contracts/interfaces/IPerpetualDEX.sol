// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPerpetualDEX {
    event PositionManagerUpdated(address indexed newPositionManager);
    event ProtocolPaused();
    event ProtocolUnpaused();

    function positionManager() external view returns (address);

    function isPaused() external view returns (bool);

    function pause() external;

    function unpause() external;
}
