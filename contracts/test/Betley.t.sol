// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";
import "./mocks/MockERC20.sol";

contract BetleyTest is Test {
    Betley betley;
    MockERC20 mockToken;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);
    address user3 = address(4);

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
        deal(user3, INITIAL_BALANCE);
        mockToken.mint(user1, INITIAL_BALANCE);
        mockToken.mint(user2, INITIAL_BALANCE);
        mockToken.mint(user3, INITIAL_BALANCE);
    }

    // Helper functions
    function createTestBet() internal returns (uint256) {
        vm.prank(user1);
        return betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    function placeTestBet(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.prank(user);
        betley.placeBet{value: amount}(betId, option, amount);
    }

    // ============ BET CREATION TESTS ============

    function testCreateBetWithValidParameters() public {
        uint8 optionCount = 2;
        uint256 duration = 1 hours;
        address token = address(0);
        address[] memory whitelist = new address[](0);

        vm.prank(user1);
        uint256 betId = betley.createBet(optionCount, duration, token, whitelist);

        // Assertions
        assertEq(betId, 0, "First bet should have ID 0");
        assertEq(betley.betCounter(), 1, "Bet counter should increment");

        // Verify bet data
        (address creator, uint256 endTime, bool resolved,, uint8 options,) =
            betley.getBetBasics(betId);
        assertEq(creator, user1, "Creator should be set correctly");
        assertEq(options, optionCount, "Option count should match");
        assertEq(resolved, false, "Bet should not be resolved initially");
    }

    function testCreateBetWithWhitelist() public {
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = user2;

        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        // Verify whitelist
        assertTrue(betley.hasWhitelist(betId), "Whitelist should be enabled");
        assertTrue(betley.isWhitelisted(betId, user1), "User1 should be whitelisted");
        assertTrue(betley.isWhitelisted(betId, user2), "User2 should be whitelisted");
        assertFalse(betley.isWhitelisted(betId, user3), "User3 should not be whitelisted");
    }

    function testCreateBetWithERC20Token() public {
        vm.prank(user1);
        uint256 betId = betley.createBet(3, 2 hours, address(mockToken), new address[](0));

        (, , , , , address token) = betley.getBetBasics(betId);
        assertEq(token, address(mockToken), "Token address should be set correctly");
    }

    function testCreateBetInvalidOptionCount() public {
        vm.startPrank(user1);

        // Too few options
        vm.expectRevert("Must have 2-4 options");
        betley.createBet(1, 1 hours, address(0), new address[](0));

        // Too many options
        vm.expectRevert("Must have 2-4 options");
        betley.createBet(5, 1 hours, address(0), new address[](0));

        vm.stopPrank();
    }

    function testCreateBetZeroDuration() public {
        vm.prank(user1);
        vm.expectRevert("Duration must be positive");
        betley.createBet(2, 0, address(0), new address[](0));
    }

    function testCreateBetInvalidWhitelistAddress() public {
        address[] memory whitelist = new address[](1);
        whitelist[0] = address(0); // Invalid address

        vm.prank(user1);
        vm.expectRevert("Invalid whitelist address");
        betley.createBet(2, 1 hours, address(0), whitelist);
    }

    // ============ BET PLACEMENT TESTS ============

    function testPlaceBetNativeToken() public {
        uint256 betId = createTestBet();
        uint256 betAmount = 1 ether;

        uint256 initialBalance = user1.balance;

        placeTestBet(betId, user1, 0, betAmount);

        // Verify balance deduction
        assertEq(user1.balance, initialBalance - betAmount, "Balance should decrease");

        // Verify bet tracking
        uint256[] memory userBets = betley.getUserBets(betId, user1);
        assertEq(userBets[0], betAmount, "Bet amount should be recorded");

        // Verify pool amounts
        uint256[] memory poolAmounts = betley.getBetAmounts(betId);
        assertEq(poolAmounts[0], betAmount, "Pool amount should be updated");
    }

    function testPlaceBetAfterEndTime() public {
        uint256 betId = createTestBet();

        // Fast forward past end time
        vm.warp(block.timestamp + 2 hours);

        vm.prank(user1);
        vm.expectRevert("Betting period ended");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
    }

    function testPlaceBetOnResolvedBet() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        // Resolve bet
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        // Try to place bet after resolution
        vm.prank(user2);
        vm.expectRevert("Bet already resolved");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
    }

    function testPlaceBetInvalidOption() public {
        uint256 betId = createTestBet(); // 2 options (0, 1)

        vm.prank(user1);
        vm.expectRevert("Invalid option");
        betley.placeBet{value: 1 ether}(betId, 2, 1 ether); // Invalid option 2
    }

    function testPlaceBetZeroAmount() public {
        uint256 betId = createTestBet();

        vm.prank(user1);
        vm.expectRevert("Amount must be positive");
        betley.placeBet{value: 0}(betId, 0, 0);
    }

    function testPlaceBetIncorrectNativeAmount() public {
        uint256 betId = createTestBet();

        vm.prank(user1);
        vm.expectRevert("Incorrect native amount");
        betley.placeBet{value: 0.5 ether}(betId, 0, 1 ether); // Send 0.5, claim 1
    }

    function testPlaceMultipleBets() public {
        uint256 betId = createTestBet();

        placeTestBet(betId, user1, 0, 1 ether);
        placeTestBet(betId, user2, 0, 2 ether);
        placeTestBet(betId, user3, 1, 1.5 ether);

        uint256[] memory poolAmounts = betley.getBetAmounts(betId);
        assertEq(poolAmounts[0], 3 ether, "Option 0 pool should be 3 ether");
        assertEq(poolAmounts[1], 1.5 ether, "Option 1 pool should be 1.5 ether");
    }

    // ============ BET RESOLUTION TESTS ============

    function testResolveBetSuccessfully() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 2 ether);
        placeTestBet(betId, user2, 1, 1 ether);

        // Resolve to option 0
        vm.prank(user1); // Creator
        betley.resolveBet(betId, 0);

        // Verify resolution
        (, , bool resolved, uint8 winningOption,,) = betley.getBetBasics(betId);
        assertTrue(resolved, "Bet should be resolved");
        assertEq(winningOption, 0, "Winning option should be 0");
    }

    function testResolveBetByNonCreator() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user2); // Not creator
        vm.expectRevert("Only creator can resolve");
        betley.resolveBet(betId, 0);
    }

    function testResolveAlreadyResolvedBet() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.prank(user1);
        vm.expectRevert("Already resolved");
        betley.resolveBet(betId, 0);
    }

    function testResolveInvalidWinningOption() public {
        uint256 betId = createTestBet(); // 2 options (0, 1)
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        vm.expectRevert("Invalid winning option");
        betley.resolveBet(betId, 2); // Invalid option 2
    }

    function testResolveToOptionWithNoBets() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);
        // No bets on option 1

        vm.prank(user1);
        vm.expectRevert("Cannot resolve to option with no bets");
        betley.resolveBet(betId, 1);
    }

    // ============ WINNINGS & REFUNDS TESTS ============

    function testClaimWinnings() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 10 ether);
        placeTestBet(betId, user2, 1, 10 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        uint256 initialBalance = user1.balance;

        vm.prank(user1);
        betley.claimWinnings(betId);

        // User1 should get: 10 ether (original) + 10 ether (share of losing pool) = 20 ether
        assertEq(user1.balance, initialBalance + 20 ether, "Should receive full winnings");

        // Verify claim status
        assertTrue(betley.hasUserClaimed(betId, user1), "Should be marked as claimed");
    }

    function testClaimWinningsNoBet() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.prank(user2); // Didn't place bet
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);
    }

    function testClaimWinningsAlreadyClaimed() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.prank(user1);
        betley.claimWinnings(betId);

        vm.prank(user1);
        vm.expectRevert("Already claimed");
        betley.claimWinnings(betId);
    }

    function testClaimRefundAfterDeadline() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);
        placeTestBet(betId, user2, 1, 1 ether);

        // Fast forward past resolution deadline
        vm.warp(block.timestamp + 25 hours);

        uint256 initialBalance = user1.balance;

        vm.prank(user1);
        betley.claimRefund(betId);

        assertEq(user1.balance, initialBalance + 1 ether, "Should receive full refund");
        assertTrue(betley.hasUserClaimed(betId, user1), "Should be marked as claimed");
    }

    function testClaimRefundBeforeDeadline() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        // Before deadline
        vm.warp(block.timestamp + 1 hours);

        vm.prank(user1);
        vm.expectRevert("Resolution deadline not passed");
        betley.claimRefund(betId);
    }

    function testClaimRefundOnResolvedBet() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.prank(user1);
        vm.expectRevert("Bet already resolved");
        betley.claimRefund(betId);
    }

    // ============ FEE SYSTEM TESTS ============

    function testUpdateFeeCreator() public {
        vm.prank(owner);
        betley.updateFeeCreator(true, 300); // 3%

        (bool creatorEnabled, uint256 creatorAmount,,,) = betley.getFeeParameters();
        assertTrue(creatorEnabled, "Creator fee should be enabled");
        assertEq(creatorAmount, 300, "Creator fee amount should be 300");
    }

    function testUpdateFeeCreatorExceedsMax() public {
        vm.prank(owner);
        vm.expectRevert("Creator fee too high");
        betley.updateFeeCreator(true, 400); // 4% > 3% max
    }

    function testUpdateFeePlatformByNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.updateFeePlatform(true, 100);
    }

    function testEmergencyDisableFees() public {
        // Enable fees first
        vm.prank(owner);
        betley.updateFeeCreator(true, 200);
        vm.prank(owner);
        betley.updateFeePlatform(true, 100);

        // Emergency disable
        vm.prank(owner);
        betley.emergencyDisableFees();

        (bool creatorEnabled,, bool platformEnabled,,) = betley.getFeeParameters();
        assertFalse(creatorEnabled, "Creator fee should be disabled");
        assertFalse(platformEnabled, "Platform fee should be disabled");
    }

    // ============ WHITELIST TESTS ============

    function testAddToWhitelist() public {
        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), new address[](0));

        vm.prank(user1);
        betley.addToWhitelist(betId, user2);

        assertTrue(betley.isWhitelisted(betId, user2), "User2 should be whitelisted");
    }

    function testAddToWhitelistByNonCreator() public {
        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), new address[](0));

        vm.prank(user2);
        vm.expectRevert("Only creator can manage whitelist");
        betley.addToWhitelist(betId, user3);
    }

    function testRemoveFromWhitelist() public {
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = user2;

        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        vm.prank(user1);
        betley.removeFromWhitelist(betId, user2);

        assertFalse(betley.isWhitelisted(betId, user2), "User2 should not be whitelisted");
    }

    function testDisableWhitelist() public {
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;

        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        vm.prank(user1);
        betley.disableWhitelist(betId);

        assertFalse(betley.hasWhitelist(betId), "Whitelist should be disabled");
        assertTrue(betley.isWhitelisted(betId, user2), "All users should be allowed after disable");
    }

    // ============ SECURITY TESTS ============

    function testOnlyOwnerFunctions() public {
        // Test updateFeeCreator
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.updateFeeCreator(true, 200);

        // Test updateFeePlatform
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.updateFeePlatform(true, 100);

        // Test updatePlatformFeeRecipient
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.updatePlatformFeeRecipient(user2);

        // Test emergencyDisableFees
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.emergencyDisableFees();

        // Test claimPlatformFees
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to onlyOwner
        betley.claimPlatformFees(address(0));
    }

    function testInputValidation() public {
        // Test invalid bet ID
        vm.prank(user1);
        vm.expectRevert("Bet does not exist");
        betley.placeBet(999, 0, 1 ether);

        // Test invalid option index
        uint256 betId = createTestBet();
        vm.prank(user1);
        vm.expectRevert("Invalid option");
        betley.placeBet{value: 1 ether}(betId, 5, 1 ether);

        // Test zero amount
        vm.prank(user1);
        vm.expectRevert("Amount must be positive");
        betley.placeBet{value: 0}(betId, 0, 0);

        // Test invalid token amount mismatch
        vm.prank(user1);
        vm.expectRevert("Incorrect native amount");
        betley.placeBet{value: 0.5 ether}(betId, 0, 1 ether);
    }

    // ============ EVENT EMISSION TESTS ============

    function testBetCreatedEvent() public {
        vm.expectEmit(true, true, false, true);
        emit BetCreated(0, user1, 2, address(0));

        vm.prank(user1);
        betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    function testBetPlacedEvent() public {
        uint256 betId = createTestBet();

        vm.expectEmit(true, true, false, true);
        emit BetPlaced(betId, user1, 0, 1 ether);

        placeTestBet(betId, user1, 0, 1 ether);
    }

    function testBetResolvedEvent() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId, 0);

        vm.prank(user1);
        betley.resolveBet(betId, 0);
    }

    function testWinningsClaimedEvent() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        vm.expectEmit(true, true, false, true);
        emit WinningsClaimed(betId, user1, 1 ether);

        vm.prank(user1);
        betley.claimWinnings(betId);
    }

    // ============ INTEGRATION TESTS ============

    function testCompleteBettingFlow() public {
        // 1. Create bet
        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), new address[](0));

        // 2. Place bets
        placeTestBet(betId, user1, 0, 5 ether);
        placeTestBet(betId, user2, 0, 5 ether);
        placeTestBet(betId, user3, 1, 10 ether);

        // 3. Verify pool amounts
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 10 ether, "Option 0 should have 10 ether");
        assertEq(amounts[1], 10 ether, "Option 1 should have 10 ether");

        // 4. Resolve bet
        vm.prank(user1);
        betley.resolveBet(betId, 0);

        // 5. Claim winnings
        uint256 user1Initial = user1.balance;
        uint256 user2Initial = user2.balance;

        vm.prank(user1);
        betley.claimWinnings(betId);

        vm.prank(user2);
        betley.claimWinnings(betId);

        // 6. Verify payouts
        // Losing pool = 10 ether
        // Each winner gets: 5 ether + (5/10 * 10) = 10 ether
        assertEq(user1.balance, user1Initial + 10 ether, "User1 should receive 10 ether");
        assertEq(user2.balance, user2Initial + 10 ether, "User2 should receive 10 ether");

        // 7. Try to claim refund (should fail)
        vm.prank(user3);
        vm.expectRevert("Bet already resolved");
        betley.claimRefund(betId);
    }

    function testBettingPeriodTiming() public {
        uint256 betId = createTestBet();

        // At start of betting period
        assertTrue(betley.canPlaceBet(betId), "Should allow betting at start");

        // During betting period
        vm.warp(block.timestamp + 30 minutes);
        assertTrue(betley.canPlaceBet(betId), "Should allow betting during period");

        // At end of betting period
        vm.warp(block.timestamp + 30 minutes);
        assertFalse(betley.canPlaceBet(betId), "Should not allow betting after end");

        // After resolution deadline
        vm.warp(block.timestamp + 25 hours);
        assertFalse(betley.canPlaceBet(betId), "Should not allow betting after deadline");
    }
}