// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";
import "./mocks/MockERC20.sol";

contract BetleyGasTest is Test {
    Betley betley;
    MockERC20 mockToken;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);

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
        mockToken.mint(user1, INITIAL_BALANCE);
        mockToken.mint(user2, INITIAL_BALANCE);
    }

    function createTestBet() internal returns (uint256) {
        vm.prank(user1);
        return betley.createBet(2, 1 hours, address(0), new address[](0));
    }

    function placeTestBet(uint256 betId, address user, uint8 option, uint256 amount) internal {
        vm.prank(user);
        betley.placeBet{value: amount}(betId, option, amount);
    }

    // ============ GAS USAGE BENCHMARKS ============

    function testGasUsageBetCreation() public {
        uint256 gasStart = gasleft();
        vm.prank(user1);
        betley.createBet(2, 1 hours, address(0), new address[](0));
        uint256 gasUsed = gasStart - gasleft();

        console.log("Bet creation gas usage:", gasUsed);
        assertLt(gasUsed, 200000, "Bet creation should use less than 200k gas");
    }

    function testGasUsageBetPlacement() public {
        uint256 betId = createTestBet();

        uint256 gasStart = gasleft();
        placeTestBet(betId, user1, 0, 1 ether);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Bet placement gas usage:", gasUsed);
        assertLt(gasUsed, 100000, "Bet placement should use less than 100k gas");
    }

    function testGasUsageBetResolution() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        uint256 gasStart = gasleft();
        vm.prank(user1);
        betley.resolveBet(betId, 0);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Bet resolution gas usage:", gasUsed);
        assertLt(gasUsed, 150000, "Bet resolution should use less than 150k gas");
    }

    function testGasUsageClaimWinnings() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        vm.prank(user1);
        betley.resolveBet(betId, 0);

        uint256 gasStart = gasleft();
        vm.prank(user1);
        betley.claimWinnings(betId);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Claim winnings gas usage:", gasUsed);
        assertLt(gasUsed, 50000, "Claim winnings should use less than 50k gas");
    }

    function testGasUsageWithWhitelist() public {
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = user2;

        uint256 gasStart = gasleft();
        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(0), whitelist);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Bet creation with whitelist gas usage:", gasUsed);
        assertLt(gasUsed, 300000, "Bet creation with whitelist should use less than 300k gas");
    }

    function testGasUsageMultipleParticipants() public {
        uint256 betId = createTestBet();

        uint256 gasStart = gasleft();
        for (uint256 i = 5; i < 15; i++) {
            address participant = address(uint160(i));
            deal(participant, 1 ether);

            vm.prank(participant);
            betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
        }
        uint256 gasUsed = gasStart - gasleft();

        console.log("10 participants gas usage:", gasUsed);
        // Gas usage should scale roughly linearly with participants
        assertLt(gasUsed, 1000000, "10 participants should use less than 1M gas");
    }

    // ============ GAS OPTIMIZATION TESTS ============

    function testGasRefundOptimization() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        // Fast forward past deadline
        vm.warp(block.timestamp + 25 hours);

        uint256 gasStart = gasleft();
        vm.prank(user1);
        betley.claimRefund(betId);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Claim refund gas usage:", gasUsed);
        assertLt(gasUsed, 30000, "Refund should be gas efficient");
    }

    function testGasUsageWithFees() public {
        // Enable fees
        vm.prank(owner);
        betley.updateFeeCreator(true, 200);

        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 10 ether);
        placeTestBet(betId, user2, 1, 10 ether);

        uint256 gasStart = gasleft();
        vm.prank(user1);
        betley.resolveBet(betId, 0);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Bet resolution with fees gas usage:", gasUsed);
        assertLt(gasUsed, 200000, "Resolution with fees should use less than 200k gas");
    }

    function testGasUsageERC20Bet() public {
        vm.prank(user1);
        uint256 betId = betley.createBet(2, 1 hours, address(mockToken), new address[](0));

        vm.startPrank(user1);
        mockToken.approve(address(betley), 100 ether);

        uint256 gasStart = gasleft();
        betley.placeBet(betId, 0, 100 ether);
        uint256 gasUsed = gasStart - gasleft();

        vm.stopPrank();

        console.log("ERC20 bet placement gas usage:", gasUsed);
        assertLt(gasUsed, 120000, "ERC20 bet placement should use less than 120k gas");
    }

    // ============ STORAGE OPTIMIZATION TESTS ============

    function testStorageSlotEfficiency() public {
        // Test that we're not wasting storage slots
        uint256 betId = createTestBet();

        // Check that view functions don't use excessive gas
        uint256 gasStart = gasleft();
        betley.getBetBasics(betId);
        uint256 gasUsed = gasStart - gasleft();

        console.log("getBetBasics gas usage:", gasUsed);
        assertLt(gasUsed, 5000, "View functions should be gas efficient");
    }

    // ============ BATCH OPERATION TESTS ============

    function testBatchBetPlacementGasEfficiency() public {
        uint256 betId = createTestBet();

        // Measure gas for individual bets
        uint256[] memory individualGas = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            address participant = address(uint160(i + 10));
            deal(participant, 1 ether);

            uint256 gasStart = gasleft();
            vm.prank(participant);
            betley.placeBet{value: 1 ether}(betId, 0, 1 ether);
            individualGas[i] = gasStart - gasleft();
        }

        uint256 averageGas = 0;
        for (uint256 i = 0; i < 5; i++) {
            averageGas += individualGas[i];
        }
        averageGas /= 5;

        console.log("Average gas per bet placement:", averageGas);
        assertLt(averageGas, 80000, "Average bet placement should be under 80k gas");
    }

    // ============ MEMORY VS STORAGE TESTS ============

    function testMemoryEfficiency() public {
        uint256 betId = createTestBet();

        // Place many bets to test memory handling
        for (uint256 i = 0; i < 20; i++) {
            address participant = address(uint160(i + 100));
            deal(participant, 1 ether);

            vm.prank(participant);
            betley.placeBet{value: 1 ether}(betId, uint8(i % 2), 1 ether);
        }

        // Test that reading large datasets doesn't use excessive gas
        uint256 gasStart = gasleft();
        uint256[] memory amounts = betley.getBetAmounts(betId);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Reading bet amounts gas usage:", gasUsed);
        assertLt(gasUsed, 10000, "Reading bet data should be efficient");
        assertEq(amounts.length, 2, "Should have correct number of options");
    }

    // ============ CONTRACT SIZE TESTS ============

    function testContractSize() public view {
        // This is more of a compile-time check, but we can verify
        // that the contract doesn't grow too large
        address contractAddress = address(betley);

        // Get contract size (this is approximate)
        uint256 size;
        assembly {
            size := extcodesize(contractAddress)
        }

        console.log("Contract size:", size, "bytes");
        assertLt(size, 25000, "Contract should be smaller than 25KB");
    }

    // ============ FUNCTION VISIBILITY TESTS ============

    function testViewFunctionGasEfficiency() public {
        uint256 betId = createTestBet();
        placeTestBet(betId, user1, 0, 1 ether);

        // Test all view functions for gas efficiency
        uint256 gasStart = gasleft();
        betley.getBetBasics(betId);
        betley.getBetAmounts(betId);
        betley.canPlaceBet(betId);
        betley.getFeeParameters();
        uint256 gasUsed = gasleft() - gasStart;

        console.log("Combined view functions gas usage:", gasUsed);
        assertLt(gasUsed, 15000, "View functions should be very gas efficient");
    }
}