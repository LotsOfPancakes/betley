// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Betley.sol";

contract DeployScript is Script {
    // Mock HYPE token address on HyperEVM testnet
    address constant HYPE_TOKEN = 0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Betley betley = new Betley(HYPE_TOKEN);
        
        console.log("Betley deployed at:", address(betley));
        console.log("Using HYPE token at:", HYPE_TOKEN);

        vm.stopBroadcast();
    }
}