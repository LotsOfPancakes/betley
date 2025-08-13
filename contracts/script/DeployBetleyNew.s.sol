// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BetleyNew.sol";

contract DeployBetleyNewScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new privacy-focused Betley contract
        Betley betley = new Betley();

        console.log("=== New Privacy-Focused Betley Deployment Complete ===");
        console.log("Contract address:", address(betley));
        console.log("Owner:", betley.owner());
        console.log("Platform fee recipient:", betley.platformFeeRecipient());
        console.log("");

        // Display initial fee status (should be disabled)
        (bool creatorEnabled, uint256 creatorAmount, bool platformEnabled, uint256 platformAmount, address recipient) =
            betley.getFeeParameters();

        console.log("=== Initial Fee Configuration ===");
        console.log("Creator fees:", creatorEnabled ? "ENABLED" : "DISABLED");
        console.log("Creator amount:", creatorAmount, "basis points");
        console.log("Platform fees:", platformEnabled ? "ENABLED" : "DISABLED");
        console.log("Platform amount:", platformAmount, "basis points");
        console.log("Fee recipient:", recipient);
        console.log("");

        console.log("=== Privacy Features ===");
        console.log("- No getBetDetails() function (prevents enumeration)");
        console.log("- Private bets mapping (no public access)");
        console.log("- Minimal on-chain data (only operational info)");
        console.log("- Sensitive data stored off-chain in database");
        console.log("");

        console.log("=== Available Functions ===");
        console.log("- getBetBasics(): creator, endTime, resolved, winningOption, optionCount, token");
        console.log("- getBetAmounts(): total amounts per option");
        console.log("- canPlaceBet(): check if betting is active");
        console.log("- All betting functions: placeBet, resolveBet, claimWinnings, etc.");
        console.log("");

        console.log("=== Next Steps ===");
        console.log("1. Update frontend NEXT_PUBLIC_BETLEY_ADDRESS to:", address(betley));
        console.log("2. Update database schema for new architecture");
        console.log("3. Update API endpoints to store sensitive data in database");
        console.log("4. Update frontend to use new minimal contract functions");
        console.log("5. Test complete privacy flow");

        vm.stopBroadcast();
    }
}
