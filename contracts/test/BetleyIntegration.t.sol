// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";
import "./mocks/MockERC20.sol";

contract BetleyIntegrationTest is Test {
    Betley betley;
    MockERC20 mockToken;

    address owner = address(1);
    address creator = address(2);
    address participant1 = address(3);
    address participant2 = address(4);
    address participant3 = address(5);
    address outsider = address(6);

    uint256 constant INITIAL_BALANCE = 1000 ether;

    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);
        betley = new Betley();
        mockToken = new MockERC20("Test Token", "TEST");
        vm.stopPrank();

        // Fund all users
        address[6] memory users = [owner, creator, participant1, participant2, participant3, outsider];
        for (uint256 i = 0; i < users.length; i++) {
            deal(users[i], INITIAL_BALANCE);
            mockToken.mint(users[i], INITIAL_BALANCE);
        }
    }

    function createBetWithWhitelist() internal returns (uint256) {
        address[] memory whitelist = new address[](3);
        whitelist[0] = creator;
        whitelist[1] = participant1;
        whitelist[2] = participant2;

        vm.prank(creator);
        return betley.createBet(3, 2 hours, address(0), whitelist);
    }

    function createBetWithoutWhitelist() internal returns (uint256) {
        vm.prank(creator);
        return betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    // ============ COMPLETE BETTING FLOWS ============

    function testCompleteBettingFlowWithWinnersAndLosers() public {
        uint256 betId = createBetWithoutWhitelist();

        // Phase 1: Betting
        uint256 creatorInitial = creator.balance;
        uint256 p1Initial = participant1.balance;
        uint256 p2Initial = participant2.balance;
        uint256 p3Initial = participant3.balance;

        // Place bets - option 0 gets more money
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        vm.prank(participant1);
        betley.placeBet{value: 10 ether}(betId, 0, 10 ether);

        vm.prank(participant2);
        betley.placeBet{value: 8 ether}(betId, 1, 8 ether);

        vm.prank(participant3);
        betley.placeBet{value: 7 ether}(betId, 1, 7 ether);

        // Verify pool amounts
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 15 ether, "Option 0 should have 15 ether");
        assertEq(amounts[1], 15 ether, "Option 1 should have 15 ether");

        // Phase 2: Resolution
        vm.prank(creator);
        betley.resolveBet(betId, 0); // Option 0 wins

        // Phase 3: Claim winnings
        // Winners (option 0): creator (5 ether), participant1 (10 ether)
        // Total winning pool: 15 ether
        // Losing pool: 15 ether
        // Each winner gets: their bet + (their bet / winning pool * losing pool)

        vm.prank(creator);
        betley.claimWinnings(betId);

        vm.prank(participant1);
        betley.claimWinnings(betId);

        // Verify payouts
        // Creator: 5 + (5/15 * 15) = 10 ether
        assertEq(creator.balance, creatorInitial + 10 ether, "Creator should receive 10 ether");

        // Participant1: 10 + (10/15 * 15) = 20 ether
        assertEq(participant1.balance, p1Initial + 20 ether, "Participant1 should receive 20 ether");

        // Losers should not be able to claim winnings
        vm.prank(participant2);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);

        vm.prank(participant3);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);
    }

    function testCompleteBettingFlowWithRefunds() public {
        uint256 betId = createBetWithoutWhitelist();

        // Place bets
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        vm.prank(participant1);
        betley.placeBet{value: 10 ether}(betId, 0, 10 ether);

        // Fast forward past resolution deadline
        vm.warp(block.timestamp + 25 hours);

        // Claim refunds
        uint256 creatorInitial = creator.balance;
        uint256 p1Initial = participant1.balance;

        vm.prank(creator);
        betley.claimRefund(betId);

        vm.prank(participant1);
        betley.claimRefund(betId);

        // Verify full refunds
        assertEq(creator.balance, creatorInitial + 5 ether, "Creator should get full refund");
        assertEq(participant1.balance, p1Initial + 10 ether, "Participant1 should get full refund");

        // Cannot claim winnings after refund period
        vm.prank(creator);
        vm.expectRevert("Bet already resolved");
        betley.claimWinnings(betId);
    }

    function testWhitelistBettingFlow() public {
        uint256 betId = createBetWithWhitelist();

        // Whitelisted users can bet
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        vm.prank(participant1);
        betley.placeBet{value: 10 ether}(betId, 1, 10 ether);

        // Non-whitelisted user cannot bet
        vm.prank(outsider);
        vm.expectRevert("Address not whitelisted");
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        // Creator can add to whitelist during betting period
        vm.prank(creator);
        betley.addToWhitelist(betId, outsider);

        // Now outsider can bet
        vm.prank(outsider);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        // Verify final pool
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 10 ether, "Option 0 should have 10 ether");
        assertEq(amounts[1], 10 ether, "Option 1 should have 10 ether");
    }

    // ============ FEE SYSTEM INTEGRATION ============

    function testFeeSystemIntegration() public {
        // Enable fees
        vm.prank(owner);
        betley.updateFeeCreator(true, 200); // 2%
        vm.prank(owner);
        betley.updateFeePlatform(true, 100); // 1%

        uint256 betId = createBetWithoutWhitelist();

        // Place bets
        vm.prank(creator);
        betley.placeBet{value: 50 ether}(betId, 0, 50 ether);

        vm.prank(participant1);
        betley.placeBet{value: 50 ether}(betId, 1, 50 ether);

        // Resolve bet
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Check fee calculations
        // Losing pool = 50 ether
        // Creator fee = 50 * 2% = 1 ether
        // Platform fee = 50 * 1% = 0.5 ether

        uint256 creatorFee = betley.pendingCreatorFees(address(0), creator);
        uint256 platformFee = betley.pendingPlatformFees(address(0));

        assertEq(creatorFee, 1 ether, "Creator should have 1 ether in pending fees");
        assertEq(platformFee, 0.5 ether, "Platform should have 0.5 ether in pending fees");

        // Claim fees
        uint256 ownerInitial = owner.balance;
        uint256 creatorInitial = creator.balance;

        vm.prank(creator);
        betley.claimCreatorFees(betId);

        vm.prank(owner);
        betley.claimPlatformFees(address(0));

        assertEq(creator.balance, creatorInitial + 1 ether, "Creator should receive fee");
        assertEq(owner.balance, ownerInitial + 0.5 ether, "Platform should receive fee");
    }

    // ============ MULTI-BET MANAGEMENT ============

    function testMultipleBetsManagement() public {
        // Create multiple bets
        vm.prank(creator);
        uint256 betId1 = betley.createBet(2, 1 hours, address(0), new address[](0));

        vm.prank(participant1);
        uint256 betId2 = betley.createBet(3, 2 hours, address(mockToken), new address[](0));

        // Interact with different bets independently
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId1, 0, 5 ether);

        vm.startPrank(participant1);
        mockToken.approve(address(betley), 100 ether);
        betley.placeBet(betId2, 0, 100 ether);
        vm.stopPrank();

        // Verify independent state
        assertEq(betley.betCounter(), 2, "Should have 2 bets total");

        uint256[] memory amounts1 = betley.getBetAmounts(betId1);
        uint256[] memory amounts2 = betley.getBetAmounts(betId2);

        assertEq(amounts1[0], 5 ether, "Bet 1 option 0 should have 5 ether");
        assertEq(amounts2[0], 100 ether, "Bet 2 option 0 should have 100 tokens");
    }

    // ============ TIMING AND DEADLINE INTEGRATION ============

    function testTimingAndDeadlinesIntegration() public {
        uint256 betId = createBetWithoutWhitelist();

        // Place bets during betting period
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        // Verify can bet during period
        assertTrue(betley.canPlaceBet(betId), "Should allow betting during period");

        // Fast forward to end of betting period
        vm.warp(block.timestamp + 1 hours);

        // Verify cannot bet after period
        assertFalse(betley.canPlaceBet(betId), "Should not allow betting after period");

        // Try to bet after period (should fail)
        vm.prank(participant1);
        vm.expectRevert("Betting period ended");
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        // Fast forward past resolution deadline
        vm.warp(block.timestamp + 24 hours);

        // Should be able to claim refund
        vm.prank(creator);
        betley.claimRefund(betId);

        // Should not be able to resolve after deadline
        vm.prank(creator);
        vm.expectRevert("Already resolved");
        betley.resolveBet(betId, 0);
    }

    // ============ EDGE CASES INTEGRATION ============

    function testEmptyBetIntegration() public {
        uint256 betId = createBetWithoutWhitelist();

        // No bets placed
        vm.warp(block.timestamp + 25 hours);

        // Should be able to claim refund (but no one bet, so no refunds)
        vm.prank(creator);
        vm.expectRevert("No bet to refund");
        betley.claimRefund(betId);
    }

    function testSingleParticipantIntegration() public {
        uint256 betId = createBetWithoutWhitelist();

        // Only one participant
        vm.prank(creator);
        betley.placeBet{value: 10 ether}(betId, 0, 10 ether);

        // Resolve bet
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Winner should get their bet back (no losing pool)
        uint256 initialBalance = creator.balance;

        vm.prank(creator);
        betley.claimWinnings(betId);

        assertEq(creator.balance, initialBalance + 10 ether, "Should get bet back");
    }

    function testAllParticipantsOnOneOption() public {
        uint256 betId = createBetWithoutWhitelist();

        // All participants bet on option 0
        vm.prank(creator);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        vm.prank(participant1);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        vm.prank(participant2);
        betley.placeBet{value: 5 ether}(betId, 0, 5 ether);

        // Cannot resolve to option 1 (no bets)
        vm.prank(creator);
        vm.expectRevert("Cannot resolve to option with no bets");
        betley.resolveBet(betId, 1);

        // Can resolve to option 0
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // All participants should get their bets back (no losing pool)
        uint256[] memory initialBalances = new uint256[](3);
        initialBalances[0] = creator.balance;
        initialBalances[1] = participant1.balance;
        initialBalances[2] = participant2.balance;

        vm.prank(creator);
        betley.claimWinnings(betId);

        vm.prank(participant1);
        betley.claimWinnings(betId);

        vm.prank(participant2);
        betley.claimWinnings(betId);

        assertEq(creator.balance, initialBalances[0] + 5 ether, "Creator should get bet back");
        assertEq(participant1.balance, initialBalances[1] + 5 ether, "Participant1 should get bet back");
        assertEq(participant2.balance, initialBalances[2] + 5 ether, "Participant2 should get bet back");
    }

    // ============ STATE CONSISTENCY INTEGRATION ============

    function testStateConsistencyAfterComplexFlow() public {
        uint256 betId = createBetWithoutWhitelist();

        // Complex betting pattern
        vm.prank(creator);
        betley.placeBet{value: 10 ether}(betId, 0, 10 ether);

        vm.prank(participant1);
        betley.placeBet{value: 15 ether}(betId, 0, 15 ether);

        vm.prank(participant2);
        betley.placeBet{value: 25 ether}(betId, 1, 25 ether);

        // Verify intermediate state
        uint256[] memory amounts = betley.getBetAmounts(betId);
        assertEq(amounts[0], 25 ether, "Option 0 should have 25 ether");
        assertEq(amounts[1], 25 ether, "Option 1 should have 25 ether");

        // Resolve bet
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        // Verify final state
        (, , bool resolved, uint8 winning,,) = betley.getBetBasics(betId);
        assertTrue(resolved, "Bet should be resolved");
        assertEq(winning, 0, "Option 0 should be winner");

        // Claim winnings
        vm.prank(creator);
        betley.claimWinnings(betId);

        vm.prank(participant1);
        betley.claimWinnings(betId);

        // Verify final balances
        // Creator: 10 + (10/25 * 25) = 20 ether
        // Participant1: 15 + (15/25 * 25) = 30 ether
        // Participant2: cannot claim (loser)

        vm.prank(participant2);
        vm.expectRevert("No winning bet to claim");
        betley.claimWinnings(betId);
    }

    // ============ CROSS-CONTRACT INTERACTIONS ============

    function testERC20BetIntegration() public {
        vm.prank(creator);
        uint256 betId = betley.createBet(2, 1 hours, address(mockToken), new address[](0));

        // Approve and place ERC20 bets
        vm.startPrank(participant1);
        mockToken.approve(address(betley), 100 ether);
        betley.placeBet(betId, 0, 100 ether);
        vm.stopPrank();

        vm.startPrank(participant2);
        mockToken.approve(address(betley), 50 ether);
        betley.placeBet(betId, 1, 50 ether);
        vm.stopPrank();

        // Verify token transfers
        assertEq(mockToken.balanceOf(address(betley)), 150 ether, "Contract should hold 150 tokens");
        assertEq(mockToken.balanceOf(participant1), INITIAL_BALANCE - 100 ether, "Participant1 should have 100 less tokens");
        assertEq(mockToken.balanceOf(participant2), INITIAL_BALANCE - 50 ether, "Participant2 should have 50 less tokens");

        // Resolve and claim
        vm.prank(creator);
        betley.resolveBet(betId, 0);

        vm.prank(participant1);
        betley.claimWinnings(betId);

        // Participant1 should get: 100 + (100/100 * 50) = 150 tokens
        assertEq(mockToken.balanceOf(participant1), INITIAL_BALANCE + 50 ether, "Participant1 should receive winnings");
    }
}