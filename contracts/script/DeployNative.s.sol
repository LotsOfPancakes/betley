// contracts/script/DeployNative.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/BetleyNative.sol";

contract DeployNativeScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy BetleyNative (no constructor parameters needed)
        BetleyNative betleyNative = new BetleyNative();
        
        console.log("BetleyNative deployed at:", address(betleyNative));
        console.log("This contract supports both native HYPE and ERC20 tokens");

        vm.stopBroadcast();
    }
}