// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";
import "./mocks/MockERC20.sol";
import "./mocks/ReentrancyAttacker.sol";

contract BetleySecurityTest is Test {
    Betley betley;
    MockERC20 mockToken;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);
    address attacker = address(4);

    uint256 constant INITIAL_BALANCE = 1000 ether;

    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);
        betley = new Betley();
        mockToken = new MockERC20("Test Token", "TEST");
        vm.stopPrank();

        // Fund users
        deal(user1, INITIAL_BALANCE);
        deal(user2, INITIAL_BALANCE);
        deal(attacker, INITIAL_BALANCE);
        mockToken.mint(user1, INITIAL_BALANCE);
        mockToken.mint(user2, INITIAL_BALANCE);
        mockToken.mint(attacker, INITIAL_BALANCE);
    }

    function createTestBet() internal returns (uint256) {
        vm.prank(user1);
        return betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    function placeTestBet(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.prank(user);
        betley.placeBet{value: amount}(betId, option, amount);
    }

    // ============ REENTRANCY PROTECTION TESTS ============

    function testReentrancyProtection() public {
        uint256 betId = createTestBet();

        ReentrancyAttacker reentrancyAttacker = new ReentrancyAttacker(betley, betId);
        deal(address(reentrancyAttacker), 1 ether);

        // This should not cause reentrancy issues
        vm.prank(address(reentrancyAttacker));
        reentrancyAttacker.attack{value: 1 ether}();

        // Resolve and try to claim
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.prank(address(reentrancyAttacker));
        betley.claimWinnings(betId); // Should work without issues
    }

    // ============ ACCESS CONTROL TESTS ============

    function testOnlyOwnerAccessControl() public {
        // Test all onlyOwner functions revert for non-owner
        vm.startPrank(user2);

        vm.expectRevert();
        betley.updateFeeCreator(true, 200);

        vm.expectRevert();
        betley.updateFeePlatform(true, 100);

        vm.expectRevert();
        betley.updatePlatformFeeRecipient(user1);

        vm.expectRevert();
        betley.emergencyDisableFees();

        vm.expectRevert();
        betley.claimPlatformFees(address(0));

        vm.stopPrank();
    }

    function testCreatorOnlyFunctions() public {
        uint256 betId = createTestBet();

        // Test resolveBet by non-creator
        vm.prank(user2);
        vm.expectRevert("Only creator can resolve");
        betley.resolveBet(betId, 0);

        // Test whitelist management by non-creator
        vm.prank(user2);
        vm.expectRevert("Only creator can manage whitelist");
        betley.addToWhitelist(betId, user3);

        vm.prank(user2);
        vm.expectRevert("Only creator can manage whitelist");
        betley.removeFromWhitelist(betId, user1);

        vm.prank(user2);
        vm.expectRevert("Only creator can manage whitelist");
        betley.disableWhitelist(betId);
    }

    // ============ INPUT VALIDATION TESTS ============

    function testBetCreationInputValidation() public {
        vm.startPrank(user1);

        // Invalid option counts
        vm.expectRevert("Must have 2-4 options");
        betley.createBet(1, 1 hours, address(0), new address[](0));

        vm.expectRevert("Must have 2-4 options");
        betley.createBet(5, 1 hours, address(0), new address[](0));

        // Zero duration
        vm.expectRevert("Duration must be positive");
        betley.createBet(2, 0, address(0), new address[](0));

        // Invalid whitelist address
        address[] memory invalidWhitelist = new address[](1);
        invalidWhitelist[0] = address(0);
        vm.expectRevert("Invalid whitelist address");
        betley.createBet(2, 1 hours, address(0), invalidWhitelist);

        vm.stopPrank();
    }

    function testBetPlacementInputValidation() public {
        uint256 betId = createTestBet();

        vm.startPrank(user1);

        // Invalid bet ID
        vm.expectRevert("Bet does not exist");
        betley.placeBet{value: 1 ether}(999, 0, 1 ether);

        // Invalid option
        vm.expectRevert("Invalid option");
        betley.placeBet{value: 1 ether}(betId, 5, 1 ether);

        // Zero amount
        vm.expectRevert("Amount must be positive");
        betley.placeBet{value: 0}(betId, 0, 0);

        // Amount mismatch
        vm.expectRevert("Incorrect native amount");
        betley.placeBet{value: 0.5 ether}(betId, 0, 1 ether);

        vm.stopPrank();
    }

    function testFeeParameterValidation() public {
        vm.startPrank(owner);

        // Creator fee too high
        vm.expectRevert("Creator fee too high");
        betley.updateFeeCreator(true, 400); // 4% > 3% max

        // Platform fee too high
        vm.expectRevert("Platform fee too high");
        betley.updateFeePlatform(true, 150); // 1.5% > 1% max

        vm.stopPrank();
    }

    // ============ WHITELIST SECURITY TESTS ============

    function testWhitelistSecurity() public {
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;

        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        // Non-whitelisted user cannot bet
        vm.prank(user2);
        vm.expectRevert("Address not whitelisted");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);

        // Whitelisted user can bet
        placeTestBet(betId, user1, 0, 1 ether);

        // Creator can add to whitelist after betting period
        vm.warp(block.timestamp + 2 hours); // After betting ends

        vm.prank(user1);
        betley.addToWhitelist(betId, user2);

        // But cannot bet after betting period anyway
        vm.prank(user2);
        vm.expectRevert("Betting period ended");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
    }

    // ============ TIMING ATTACK TESTS ============

    function testTimingAttackPrevention() public {
        uint256 betId = createTestBet();

        // Place bet at exact end time
        vm.warp(block.timestamp + 1 hours);
        placeTestBet(betId, user1, 0, 1 ether);

        // Try to place bet 1 second after end time
        vm.warp(block.timestamp + 1);
        vm.prank(user2);
        vm.expectRevert("Betting period ended");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
    }

    // ============ OVERFLOW/UNDERFLOW PROTECTION ============

    function testLargeAmountHandling() public {
        uint256 betId = createTestBet();
        uint256 largeAmount = 1000 ether;

        deal(user1, largeAmount);
        placeTestBet(betId, user1, 0, largeAmount);

        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], largeAmount, "Should handle large amounts correctly");
    }

    // ============ FRONT-RUNNING PROTECTION ============

    function testFrontRunningProtection() public {
        uint256 betId = createTestBet();

        // Attacker tries to front-run resolution
        placeTestBet(betId, user1, 0, 10 ether);
        placeTestBet(betId, user2, 1, 10 ether);

        // Attacker tries to resolve before creator
        vm.prank(attacker);
        vm.expectRevert("Only creator can resolve");
        betley.resolveBet(betId, 0);

        // Creator resolves legitimately
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        // Attacker tries to claim winnings they didn't earn
        vm.prank(attacker);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);
    }

    // ============ GAS LIMIT TESTS ============

    function testGasLimitHandling() public {
        uint256 betId = createTestBet();

        // Test with many participants
        for (uint256 i = 5; i < 25; i++) {
            address participant = address(uint160(i));
            deal(participant, 1 ether);

            vm.prank(participant);
            betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
        }

        // Should not hit gas limits
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 20 ether, "Should handle many participants");
    }

    // ============ STATE CONSISTENCY TESTS ============

    function testStateConsistencyAfterFailures() public {
        uint256 betId = createTestBet();

        // Place a bet
        placeTestBet(betId, user1, 0, 1 ether);

        // Try to resolve with invalid option (should fail)
        vm.prank(user1);
        vm.expectRevert("Invalid winning option");
        betley.resolveBet(betId, 5);

        // State should remain consistent
        (, , bool resolved,,,) = betley.getBetBasics(betId);
        assertFalse(resolved, "Bet should still be unresolved");

        // Should still be able to resolve with valid option
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        (, , resolved,,,) = betley.getBetBasics(betId);
        assertTrue(resolved, "Bet should now be resolved");
    }

    // ============ FEE MANIPULATION TESTS ============

    function testFeeManipulationPrevention() public {
        // Enable fees
        vm.prank(owner);
        betley.updateFeeCreator(true, 200); // 2%

        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 10 ether);
        placeTestBet(betId, user2, 1, 10 ether);

        // Try to manipulate fees by re-resolving
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        // Fees should only be calculated once
        uint256 pendingFees = betley.pendingCreatorFees(address(0), user1);
        assertEq(pendingFees, 0.2 ether, "Should have correct fee amount");

        // Try to resolve again (should fail)
        vm.prank(user1);
        vm.expectRevert("Already resolved");
        betley.resolveBet(betId, 0);

        // Fees should still be the same
        pendingFees = betley.pendingCreatorFees(address(0), user1);
        assertEq(pendingFees, 0.2 ether, "Fees should not change");
    }
}