// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Betley.sol";

/**
 * @title ConfigureFees
 * @dev Scripts for managing fee parameters after Betley deployment
 *
 * Usage examples:
 *
 * 1. View current fee status:
 *    forge script script/ConfigureFees.s.sol:ViewFees --rpc-url <RPC>
 *
 * 2. Enable production fees (1% creator + 0.5% platform):
 *    forge script script/ConfigureFees.s.sol:EnableFees --rpc-url <RPC> --broadcast
 *
 * 3. Disable all fees:
 *    forge script script/ConfigureFees.s.sol:DisableFees --rpc-url <RPC> --broadcast
 *
 * 4. Claim platform fees:
 *    forge script script/ConfigureFees.s.sol:ClaimFees --rpc-url <RPC> --broadcast
 *
 * 5. Enable test fees (minimal):
 *    forge script script/ConfigureFees.s.sol:TestFees --rpc-url <RPC> --broadcast
 */
contract ViewFees is Script {
    function run() external view {
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");
        Betley betley = Betley(payable(contractAddress));

        console.log("=== Betley Fee Status ===");
        console.log("Contract:", contractAddress);
        console.log("Owner:", betley.owner());
        console.log("");

        // Get current fee parameters
        (bool creatorEnabled, uint256 creatorAmount, bool platformEnabled, uint256 platformAmount, address recipient) =
            betley.getFeeParameters();

        console.log("=== Fee Configuration ===");
        if (creatorEnabled) {
            console.log("Creator fees: ENABLED");
            console.log("Creator rate:", creatorAmount / 100, "% of losing bets");
        } else {
            console.log("Creator fees: DISABLED");
        }

        if (platformEnabled) {
            console.log("Platform fees: ENABLED");
            console.log("Platform rate:", platformAmount / 100, "% of losing bets");
        } else {
            console.log("Platform fees: DISABLED");
        }

        console.log("Platform recipient:", recipient);

        if (creatorEnabled || platformEnabled) {
            uint256 totalRate = (creatorAmount + platformAmount) / 100;
            console.log("Total fee rate:", totalRate, "% of losing bets");
        }

        // Check pending platform fees (native token)
        uint256 pendingNative = betley.pendingPlatformFees(address(0));
        if (pendingNative > 0) {
            console.log("");
            console.log("=== Pending Platform Fees ===");
            console.log("Native token fees pending:", pendingNative, "wei");
        }

        console.log("");
        console.log("=== Fee Limits ===");
        console.log("Max creator fee:", betley.MAX_CREATOR_FEE(), "basis points");
        console.log("Max creator fee percentage:", betley.MAX_CREATOR_FEE() / 100, "%");
        console.log("Max platform fee:", betley.MAX_PLATFORM_FEE(), "basis points");
        console.log("Max platform fee percentage:", betley.MAX_PLATFORM_FEE() / 100, "%");
    }
}

contract EnableFees is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Betley betley = Betley(payable(contractAddress));

        // Enable creator fees: 1% (100 basis points)
        betley.updateFeeCreator(true, 100);
        console.log("Creator fees enabled: 1% of losing bets");

        // Enable platform fees: 0.5% (50 basis points)
        betley.updateFeePlatform(true, 50);
        console.log("Platform fees enabled: 0.5% of losing bets");

        console.log("");
        console.log("=== Production Fees Active ===");
        console.log("Total fee rate: 1.5% of losing bets");
        console.log("Fees only apply when bets are resolved properly");
        console.log("Unresolved bets = 100% refunds (no fees)");

        vm.stopBroadcast();
    }
}

contract DisableFees is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Betley betley = Betley(payable(contractAddress));

        // Use emergency disable function
        betley.emergencyDisableFees();
        console.log("All fees disabled via emergency function");

        // Confirm status
        (bool creatorEnabled,, bool platformEnabled,,) = betley.getFeeParameters();
        console.log("Creator fees:", creatorEnabled ? "ENABLED" : "DISABLED");
        console.log("Platform fees:", platformEnabled ? "ENABLED" : "DISABLED");

        vm.stopBroadcast();
    }
}

contract ClaimFees is Script {
    function run() external {
        uint256 recipientPrivateKey = vm.envUint("PLATFORM_RECIPIENT_PRIVATE_KEY");
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");

        vm.startBroadcast(recipientPrivateKey);

        Betley betley = Betley(payable(contractAddress));

        // Check pending fees before claiming
        uint256 pendingNative = betley.pendingPlatformFees(address(0));

        if (pendingNative > 0) {
            console.log("Claiming platform fees:", pendingNative, "wei");
            betley.claimPlatformFees(address(0)); // Native token
            console.log("Platform fees claimed successfully");
        } else {
            console.log("No pending platform fees to claim");
        }

        vm.stopBroadcast();
    }
}

contract UpdateRecipient is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");
        address newRecipient = vm.envAddress("NEW_PLATFORM_RECIPIENT");

        vm.startBroadcast(deployerPrivateKey);

        Betley betley = Betley(payable(contractAddress));

        address oldRecipient = betley.platformFeeRecipient();
        betley.updatePlatformFeeRecipient(newRecipient);

        console.log("Platform fee recipient updated");
        console.log("Old recipient:", oldRecipient);
        console.log("New recipient:", newRecipient);

        vm.stopBroadcast();
    }
}

contract TestFees is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("BETLEY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Betley betley = Betley(payable(contractAddress));

        // Enable minimal fees for testing
        betley.updateFeeCreator(true, 200); // 2%
        betley.updateFeePlatform(true, 100); // 1%

        console.log("Test fees enabled:");
        console.log("Creator fee: 2% of losing bets");
        console.log("Platform fee: 1% of losing bets");
        console.log("Total: 3% of losing bets");
        console.log("");
        console.log("This is a conservative setup for initial testing.");
        console.log("Use EnableFees script for production rates.");

        vm.stopBroadcast();
    }
}
