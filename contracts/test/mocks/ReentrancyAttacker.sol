// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../src/Betley.sol";

contract ReentrancyAttacker {
    Betley betley;
    uint256 betId;
    bool isAttacking = false;

    constructor(Betley _betley, uint256 _betId) {
        betley = _betley;
        betId = _betId;
    }

    function attack() external payable {
        isAttacking = true;
        betley.placeBet{value: msg.value}(betId, 0, msg.value);
    }

    receive() external payable {
        if (isAttacking) {
            isAttacking = false;
            // Try to reenter
            betley.claimWinnings(betId);
        }
    }
}