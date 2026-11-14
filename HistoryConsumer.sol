// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITrinityHistoricalPaid {
    function requestsOpened() external view returns (uint256);
    function MAX_REQUESTS() external view returns (uint256);
    function orders(bytes32 id) external view returns (
        address payer, uint256 amount, bytes32 quoteHash, uint8 state);
}

/// Read-only Base Sepolia adapter for an exhausted test, not a randomness request.
/// No constructor networking, payable function, approval, telemetry or callbacks.
contract HistoryConsumer {
    function historicalOrder(bytes32 requestId) external view returns (
        address payer, uint256 amount, bytes32 quoteHash, uint8 state
    ) {
        require(block.chainid == 84532, "Base Sepolia only");
        return ITrinityHistoricalPaid(0xF12a01AdcCc070d1319899E7DA74A92c60380bA9).orders(requestId);
    }
}
