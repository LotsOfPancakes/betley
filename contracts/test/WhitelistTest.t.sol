// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Betley.sol";

contract WhitelistTest is Test {
    Betley public betley;
    address public creator = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);

    function setUp() public {
        betley = new Betley();
    }

    function testCreateBetWithoutWhitelist() public {
        vm.prank(creator);
        address[] memory empty = new address[](0);
        uint256 betId = betley.createBet(2, 3600, address(0), empty);
        
        assertFalse(betley.getWhitelistStatus(betId));
        assertTrue(betley.isWhitelisted(betId, user1));
        assertTrue(betley.isWhitelisted(betId, user2));
    }

    function testCreateBetWithWhitelist() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = user2;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        assertTrue(betley.getWhitelistStatus(betId));
        assertFalse(betley.isWhitelisted(betId, creator)); // Creator NOT auto-whitelisted
        assertTrue(betley.isWhitelisted(betId, user1));
        assertTrue(betley.isWhitelisted(betId, user2));
        assertFalse(betley.isWhitelisted(betId, user3));
    }

    function testWhitelistedUserCanBet() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // Whitelisted user can bet
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        betley.placeBet{value: 0.1 ether}(betId, 0, 0.1 ether);
        
        uint256[] memory userBets = betley.getUserBets(betId, user1);
        assertEq(userBets[0], 0.1 ether);
    }

    function testNonWhitelistedUserCannotBet() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // Non-whitelisted user cannot bet
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        vm.expectRevert("Address not whitelisted");
        betley.placeBet{value: 0.1 ether}(betId, 0, 0.1 ether);
    }

    function testAddToWhitelist() public {
        vm.prank(creator);
        address[] memory empty = new address[](0);
        uint256 betId = betley.createBet(2, 3600, address(0), empty);
        
        // Add user to whitelist
        vm.prank(creator);
        betley.addToWhitelist(betId, user1);
        
        assertTrue(betley.getWhitelistStatus(betId));
        assertTrue(betley.isWhitelisted(betId, user1));
        assertFalse(betley.isWhitelisted(betId, user2)); // user2 not whitelisted
    }

    function testRemoveFromWhitelist() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // Remove user from whitelist
        vm.prank(creator);
        betley.removeFromWhitelist(betId, user1);
        
        assertFalse(betley.isWhitelisted(betId, user1));
        assertFalse(betley.isWhitelisted(betId, creator)); // Creator also not whitelisted
    }

    function testCanRemoveCreatorFromWhitelist() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = creator; // Explicitly add creator to whitelist
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // Creator can be removed from whitelist now
        vm.prank(creator);
        betley.removeFromWhitelist(betId, creator);
        
        assertFalse(betley.isWhitelisted(betId, creator));
        assertTrue(betley.isWhitelisted(betId, user1));
    }

    function testDisableWhitelist() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // Disable whitelist
        vm.prank(creator);
        betley.disableWhitelist(betId);
        
        assertFalse(betley.getWhitelistStatus(betId));
        assertTrue(betley.isWhitelisted(betId, user2)); // Now everyone can participate
    }

    function testOnlyCreatorCanManageWhitelist() public {
        vm.prank(creator);
        address[] memory empty = new address[](0);
        uint256 betId = betley.createBet(2, 3600, address(0), empty);
        
        // Non-creator cannot add to whitelist
        vm.prank(user1);
        vm.expectRevert("Only creator can manage whitelist");
        betley.addToWhitelist(betId, user2);
    }

    function testCanUserPlaceBet() public {
        vm.prank(creator);
        address[] memory whitelist = new address[](1);
        whitelist[0] = user1;
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        assertTrue(betley.canUserPlaceBet(betId, user1)); // Whitelisted
        assertFalse(betley.canUserPlaceBet(betId, user2)); // Not whitelisted
    }

    function testWhitelistDoesNotAffectClaiming() public {
        // Create bet with whitelist including both user1 and creator
        vm.prank(creator);
        address[] memory whitelist = new address[](2);
        whitelist[0] = user1;
        whitelist[1] = creator; // Explicitly add creator to whitelist
        
        uint256 betId = betley.createBet(2, 3600, address(0), whitelist);
        
        // User1 places bet
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        betley.placeBet{value: 0.1 ether}(betId, 0, 0.1 ether);
        
        // Creator places bet on different option
        vm.deal(creator, 1 ether);
        vm.prank(creator);
        betley.placeBet{value: 0.1 ether}(betId, 1, 0.1 ether);
        
        // Resolve bet in favor of user1
        vm.prank(creator);
        betley.resolveBet(betId, 0);
        
        // Remove user1 from whitelist
        vm.prank(creator);
        betley.removeFromWhitelist(betId, user1);
        
        // User1 should still be able to claim winnings even though removed from whitelist
        vm.prank(user1);
        betley.claimWinnings(betId);
        
        // Verify user1 received winnings
        assertTrue(betley.hasUserClaimed(betId, user1));
    }
}