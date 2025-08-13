// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Betley.sol";

contract DeployBetleyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Betley (clean, production-ready contract)
        Betley betley = new Betley();

        console.log("=== Betley Deployment Complete ===");
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
        console.log("=== Next Steps ===");
        console.log("1. Update frontend NEXT_PUBLIC_BETLEY_ADDRESS to:", address(betley));
        console.log("2. Test all functionality with fees disabled");
        console.log("3. Enable fees when ready using ConfigureFees scripts");

        vm.stopBroadcast();
    }
}
