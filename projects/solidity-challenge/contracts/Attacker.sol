// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {Contract} from "./Contract.sol";

contract Attacker {
    Contract _contract;

    constructor(address contractAddress) {
        _contract = Contract(contractAddress);
    }

    function attack() public {
        _contract.attempt();
    }
}