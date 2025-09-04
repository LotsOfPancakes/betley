// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";
import "./mocks/MockERC20.sol";

contract BetleyTest is Test {
    Betley betley;
    MockERC20 mockToken;

    address owner = address(1);
    address creator = address(2);
    address user1 = address(3);
    address user2 = address(4);
    address user3 = address(5);

    uint256 constant INITIAL_BALANCE = 1000 ether;

    event BetCreated(uint256 indexed betId, address indexed creator, uint8 optionCount, address token);
    event BetPlaced(uint256 indexed betId, address indexed user, uint8 option, uint256 amount);
    event BetResolved(uint256 indexed betId, uint8 winningOption);
    event WinningsClaimed(uint256 indexed betId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed betId, address indexed user, uint256 amount);

    function setUp() public {
        vm.startPrank(owner);
        betley = new Betley();
        mockToken = new MockERC20("Test Token", "TEST");
        vm.stopPrank();

        // Fund all users
        deal(owner, INITIAL_BALANCE);
        deal(creator, INITIAL_BALANCE);
        deal(user1, INITIAL_BALANCE);
        deal(user2, INITIAL_BALANCE);
        deal(user3, INITIAL_BALANCE);

        mockToken.mint(creator, INITIAL_BALANCE);
        mockToken.mint(user1, INITIAL_BALANCE);
        mockToken.mint(user2, INITIAL_BALANCE);
        mockToken.mint(user3, INITIAL_BALANCE);
    }

    // ========== HELPER FUNCTIONS ==========

    function createTestBet() internal returns (uint256) {
        vm.prank(creator);
        return betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    function createTestBetWithToken() internal returns (uint256) {
        vm.prank(creator);
        return betley.createBet(2, 1 hours, address(mockToken), new address[](0));
    }

    function placeNativeBet(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.prank(user);
        betley.placeBet{value: amount}(betId, option, amount);
    }

    function placeTokenBet(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.startPrank(user);
        mockToken.approve(address(betley), amount);
        betley.placeBet(betId, option, amount);
        vm.stopPrank();
    }

    // ========== BET CREATION TESTS ==========

    function testCreateBetBasic() public {
        uint8 optionCount = 2;
        uint256 duration = 1 hours;

        vm.expectEmit(true, true, false, true);
        emit BetCreated(0, creator, optionCount, address(0));

        vm.prank(creator);
        uint256 betId = betley.createBet(optionCount, duration, address(0), new address[](0));

        assertEq(betId, 0, "First bet should have ID 0");
        assertEq(betley.betCounter(), 1, "Bet counter should increment");

        (address betCreator, uint256 endTime, bool resolved, uint8 winningOption, uint8 options, address token) = 
            betley.getBetBasics(betId);

        assertEq(betCreator, creator, "Creator should be set");
        assertEq(options, optionCount, "Option count should match");
        assertFalse(resolved, "Should not be resolved initially");
        assertEq(token, address(0), "Should use native token");
        assertEq(endTime, block.timestamp + duration, "End time should be set correctly");
    }

    function testCreateBetWithERC20() public {
        vm.prank(creator);
        uint256 betId = betley.createBet(3, 2 hours, address(mockToken), new address[](0));

        (, , , , uint8 options, address token) = betley.getBetBasics(betId);
        assertEq(options, 3, "Should have 3 options");
        assertEq(token, address(mockToken), "Should use mock token");
    }

    function testCreateBetWithWhitelist() public {
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = user2;

        vm.prank(creator);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        assertTrue(betley.getWhitelistStatus(betId), "Whitelist should be enabled");
        assertTrue(betley.isWhitelisted(betId, user1), "User1 should be whitelisted");
        assertTrue(betley.isWhitelisted(betId, user2), "User2 should be whitelisted");
        assertFalse(betley.isWhitelisted(betId, user3), "User3 should not be whitelisted");
    }

    function testCreateBetInvalidParameters() public {
        vm.startPrank(creator);

        // Test invalid option counts
        vm.expectRevert("Must have 2-4 options");
        betley.createBet(1, 1 hours, address(0), new address[](0));

        vm.expectRevert("Must have 2-4 options");
        betley.createBet(5, 1 hours, address(0), new address[](0));

        // Test zero duration
        vm.expectRevert("Duration must be positive");
        betley.createBet(2, 0, address(0), new address[](0));

        vm.stopPrank();
    }

    // ========== BET PLACEMENT TESTS ==========

    function testPlaceBetNative() public {
        uint256 betId = createTestBet();
        uint256 betAmount = 1 ether;

        uint256 initialBalance = user1.balance;

        vm.expectEmit(true, true, false, true);
        emit BetPlaced(betId, user1, 0, betAmount);

        placeNativeBet(betId, user1, 0, betAmount);

        assertEq(user1.balance, initialBalance - betAmount, "Balance should decrease");

        uint256[] memory userBets = betley.getUserBets(betId, user1);
        assertEq(userBets[0], betAmount, "User bet should be recorded");

        uint256[] memory poolAmounts = betley.getBetAmounts(betId);
        assertEq(poolAmounts[0], betAmount, "Pool amount should be updated");
    }

    function testPlaceBetERC20() public {
        uint256 betId = createTestBetWithToken();
        uint256 betAmount = 100 * 10**18;

        uint256 initialBalance = mockToken.balanceOf(user1);

        placeTokenBet(betId, user1, 0, betAmount);

        assertEq(mockToken.balanceOf(user1), initialBalance - betAmount, "Token balance should decrease");
        assertEq(mockToken.balanceOf(address(betley)), betAmount, "Contract should hold tokens");

        uint256[] memory userBets = betley.getUserBets(betId, user1);
        assertEq(userBets[0], betAmount, "User bet should be recorded");
    }

    function testPlaceBetMultipleUsers() public {
        uint256 betId = createTestBet();

        placeNativeBet(betId, user1, 0, 2 ether);
        placeNativeBet(betId, user2, 0, 3 ether);
        placeNativeBet(betId, user3, 1, 5 ether);

        uint256[] memory poolAmounts = betley.getBetAmounts(betId);
        assertEq(poolAmounts[0], 5 ether, "Option 0 should have 5 ether");
        assertEq(poolAmounts[1], 5 ether, "Option 1 should have 5 ether");

        uint256[] memory user1Bets = betley.getUserBets(betId, user1);
        uint256[] memory user3Bets = betley.getUserBets(betId, user3);
        assertEq(user1Bets[0], 2 ether, "User1 should have 2 ether on option 0");
        assertEq(user3Bets[1], 5 ether, "User3 should have 5 ether on option 1");
    }

    function testPlaceBetInvalidConditions() public {
        uint256 betId = createTestBet();

        vm.startPrank(user1);

        // Test betting after end time
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert("Betting period ended");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);

        // Reset time and resolve bet
        vm.warp(block.timestamp - 2 hours);
        vm.stopPrank();
        
        placeNativeBet(betId, user1, 0, 1 ether);
        
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Test betting on resolved bet
        vm.prank(user2);
        vm.expectRevert("Bet already resolved");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);

        vm.stopPrank();
    }

    // ========== BET RESOLUTION TESTS ==========

    function testResolveBet() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 2 ether);
        placeNativeBet(betId, user2, 1, 3 ether);

        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId, 0);

        vm.prank(creator);
        betley.resolveBet(betId, 0);

        (, , bool resolved, uint8 winningOption, ,) = betley.getBetBasics(betId);
        assertTrue(resolved, "Bet should be resolved");
        assertEq(winningOption, 0, "Winning option should be 0");
    }

    function testResolveBetOnlyCreator() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        vm.expectRevert("Only creator can resolve");
        betley.resolveBet(betId, 0);
    }

    function testResolveBetInvalidOption() public {
        uint256 betId = createTestBet(); // 2 options (0, 1)
        placeNativeBet(betId, user1, 0, 1 ether);

        vm.prank(creator);
        vm.expectRevert("Invalid winning option");
        betley.resolveBet(betId, 2);
    }

    function testResolveBetNoWinningBets() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 1 ether);
        // No bets on option 1

        vm.prank(creator);
        vm.expectRevert("Cannot resolve to option with no bets");
        betley.resolveBet(betId, 1);
    }

    // ========== WINNINGS TESTS ==========

    function testClaimWinnings() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 10 ether);
        placeNativeBet(betId, user2, 1, 10 ether);

        vm.prank(creator);
        betley.resolveBet(betId, 0);

        uint256 initialBalance = user1.balance;

        vm.expectEmit(true, true, false, true);
        emit WinningsClaimed(betId, user1, 20 ether);

        vm.prank(user1);
        betley.claimWinnings(betId);

        // User1 should get: 10 ether (original) + 10 ether (losing pool) = 20 ether
        assertEq(user1.balance, initialBalance + 20 ether, "Should receive full winnings");
        assertTrue(betley.hasUserClaimed(betId, user1), "Should be marked as claimed");
    }

    function testClaimWinningsInvalidCases() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 1 ether);

        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Test claiming when not a winner
        vm.prank(user2);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);

        // Test double claiming
        vm.prank(user1);
        betley.claimWinnings(betId);

        vm.prank(user1);
        vm.expectRevert("Already claimed");
        betley.claimWinnings(betId);
    }

    // ========== REFUND TESTS ==========

    function testClaimRefund() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 5 ether);
        placeNativeBet(betId, user2, 1, 3 ether);

        // Fast forward past resolution deadline (endTime + 24 hours)
        // createTestBet creates with 1 hour duration, so deadline is at 1 + 24 = 25 hours
        vm.warp(block.timestamp + 25 hours + 1);

        uint256 initialBalance = user1.balance;

        vm.expectEmit(true, true, false, true);
        emit RefundClaimed(betId, user1, 5 ether);

        vm.prank(user1);
        betley.claimRefund(betId);

        assertEq(user1.balance, initialBalance + 5 ether, "Should receive full refund");
        assertTrue(betley.hasUserClaimed(betId, user1), "Should be marked as claimed");
    }

    function testClaimRefundInvalidCases() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 1 ether);

        // Test refund before deadline
        vm.prank(user1);
        vm.expectRevert("Resolution deadline not passed");
        betley.claimRefund(betId);

        // Test refund on resolved bet
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        vm.prank(user1);
        vm.expectRevert("Bet already resolved");
        betley.claimRefund(betId);
    }

    // ========== WHITELIST TESTS ==========

    function testWhitelistFunctionality() public {
        uint256 betId = createTestBet();

        // Add to whitelist
        vm.prank(creator);
        betley.addToWhitelist(betId, user1);

        assertTrue(betley.getWhitelistStatus(betId), "Whitelist should be enabled");
        assertTrue(betley.isWhitelisted(betId, user1), "User1 should be whitelisted");

        // Non-whitelisted user cannot bet
        vm.prank(user2);
        vm.expectRevert("Address not whitelisted");
        betley.placeBet{value: 1 ether}(betId, 0, 1 ether);

        // Whitelisted user can bet
        placeNativeBet(betId, user1, 0, 1 ether);

        // Remove from whitelist
        vm.prank(creator);
        betley.removeFromWhitelist(betId, user1);

        assertFalse(betley.isWhitelisted(betId, user1), "User1 should not be whitelisted");
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testCanPlaceBet() public {
        uint256 betId = createTestBet();

        assertTrue(betley.canPlaceBet(betId), "Should allow betting initially");

        // After end time
        vm.warp(block.timestamp + 2 hours);
        assertFalse(betley.canPlaceBet(betId), "Should not allow betting after end time");
    }

    function testCanUserPlaceBet() public {
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;

        vm.prank(creator);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);

        assertTrue(betley.canUserPlaceBet(betId, user1), "Whitelisted user should be able to bet");
        assertFalse(betley.canUserPlaceBet(betId, user2), "Non-whitelisted user should not be able to bet");

        // After betting ends
        vm.warp(block.timestamp + 2 hours);
        assertFalse(betley.canUserPlaceBet(betId, user1), "No one should be able to bet after end time");
    }

    function testCalculatePotentialWinnings() public {
        uint256 betId = createTestBet();
        placeNativeBet(betId, user1, 0, 10 ether);
        placeNativeBet(betId, user2, 1, 20 ether);

        vm.prank(creator);
        betley.resolveBet(betId, 0);

        uint256 potentialWinnings = betley.calculatePotentialWinnings(betId, user1);
        // User1 should get: 10 ether (original) + 20 ether (losing pool) = 30 ether
        assertEq(potentialWinnings, 30 ether, "Potential winnings should be calculated correctly");

        uint256 loserWinnings = betley.calculatePotentialWinnings(betId, user2);
        assertEq(loserWinnings, 0, "Loser should have no winnings");
    }

    // ========== INTEGRATION TESTS ==========

    function testCompleteBettingFlow() public {
        // Create bet
        vm.prank(creator);
        uint256 betId = betley.createBet(2, 1 hours, address(0), new address[](0));

        // Place bets
        placeNativeBet(betId, user1, 0, 5 ether);
        placeNativeBet(betId, user2, 0, 5 ether);
        placeNativeBet(betId, user3, 1, 10 ether);

        // Verify pool amounts
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 10 ether, "Option 0 should have 10 ether");
        assertEq(amounts[1], 10 ether, "Option 1 should have 10 ether");

        // Resolve bet
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Claim winnings
        uint256 user1Initial = user1.balance;
        uint256 user2Initial = user2.balance;

        vm.prank(user1);
        betley.claimWinnings(betId);

        vm.prank(user2);
        betley.claimWinnings(betId);

        // Each winner gets: 5 ether + (5/10 * 10) = 10 ether
        assertEq(user1.balance, user1Initial + 10 ether, "User1 should receive correct winnings");
        assertEq(user2.balance, user2Initial + 10 ether, "User2 should receive correct winnings");

        // Loser cannot claim
        vm.prank(user3);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);
    }
}