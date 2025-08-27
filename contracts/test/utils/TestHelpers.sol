// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/Betley.sol";
import "../mocks/MockERC20.sol";

contract TestHelpers is Test {
    // Common test setup utilities

    function createUsers(uint256 count) internal returns (address[] memory) {
        address[] memory users = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            users[i] = address(uint160(100 + i));
            deal(users[i], 1000 ether);
        }
        return users;
    }

    function fundUsersWithTokens(address[] memory users, MockERC20 token, uint256 amount) internal {
        for (uint256 i = 0; i < users.length; i++) {
            token.mint(users[i], amount);
        }
    }

    function createBetWithParticipants(
        Betley betley,
        address creator,
        uint8 optionCount,
        uint256 duration,
        address[] memory participants,
        uint256 betAmount
    ) internal returns (uint256) {
        vm.prank(creator);
        uint256 betId = betley.createBet(optionCount, duration, address(0), new address[](0));

        // Have participants place bets
        for (uint256 i = 0; i < participants.length; i++) {
            vm.prank(participants[i]);
            betley.placeBet{value: betAmount}(betId, uint8(i % optionCount), betAmount);
        }

        return betId;
    }

    function fastForwardToBetEnd(uint256 betId, Betley betley) internal {
        (, uint256 endTime,,,) = betley.getBetBasics(betId);
        vm.warp(endTime + 1);
    }

    function fastForwardToRefundDeadline(uint256 betId, Betley betley) internal {
        (, uint256 endTime,,,) = betley.getBetBasics(betId);
        vm.warp(endTime + 24 hours + 1);
    }

    function calculateExpectedWinnings(
        uint256 userBet,
        uint256 winningPool,
        uint256 losingPool
    ) internal pure returns (uint256) {
        return userBet + (userBet * losingPool) / winningPool;
    }

    function assertBalancesChanged(
        address[] memory users,
        uint256[] memory initialBalances,
        int256[] memory expectedChanges
    ) internal view {
        for (uint256 i = 0; i < users.length; i++) {
            int256 actualChange = int256(users[i].balance) - int256(initialBalances[i]);
            assertEq(actualChange, expectedChanges[i], "Balance change mismatch");
        }
    }

    // Event emission helpers
    function expectBetCreated(uint256 betId, address creator, uint8 optionCount, address token) internal {
        vm.expectEmit(true, true, false, true);
        emit BetCreated(betId, creator, optionCount, token);
    }

    function expectBetPlaced(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.expectEmit(true, true, false, true);
        emit BetPlaced(betId, user, option, amount);
    }

    function expectBetResolved(uint256 betId, uint8 winningOption) internal {
        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId, winningOption);
    }

    function expectWinningsClaimed(uint256 betId, address user, uint256 amount) internal {
        vm.expectEmit(true, true, false, true);
        emit WinningsClaimed(betId, user, amount);
    }

    // State validation helpers
    function validateBetState(
        Betley betley,
        uint256 betId,
        address expectedCreator,
        uint256 expectedEndTime,
        bool expectedResolved,
        uint8 expectedWinningOption,
        uint8 expectedOptionCount
    ) internal view {
        (
            address creator,
            uint256 endTime,
            bool resolved,
            uint8 winningOption,
            uint8 optionCount,
        ) = betley.getBetBasics(betId);

        assertEq(creator, expectedCreator, "Creator mismatch");
        assertEq(endTime, expectedEndTime, "End time mismatch");
        assertEq(resolved, expectedResolved, "Resolved state mismatch");
        assertEq(winningOption, expectedWinningOption, "Winning option mismatch");
        assertEq(optionCount, expectedOptionCount, "Option count mismatch");
    }

    function validatePoolAmounts(
        Betley betley,
        uint256 betId,
        uint256[] memory expectedAmounts
    ) internal view {
        uint256[] memory actualAmounts = betley.getBetAmounts(betId);
        assertEq(actualAmounts.length, expectedAmounts.length, "Pool length mismatch");

        for (uint256 i = 0; i < expectedAmounts.length; i++) {
            assertEq(actualAmounts[i], expectedAmounts[i], "Pool amount mismatch");
        }
    }

    // Gas measurement helpers
    function measureGasUsage(function() internal returns (uint256) fn) internal returns (uint256) {
        uint256 gasStart = gasleft();
        uint256 result = fn();
        uint256 gasUsed = gasStart - gasleft();
        return gasUsed;
    }

    // Random data generators for fuzzing
    function randomUint8(uint256 seed) internal pure returns (uint8) {
        return uint8(uint256(keccak256(abi.encode(seed))) % 256);
    }

    function randomAddress(uint256 seed) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode(seed)))));
    }

    function randomAmount(uint256 seed, uint256 min, uint256 max) internal pure returns (uint256) {
        return min + (uint256(keccak256(abi.encode(seed))) % (max - min + 1));
    }
}