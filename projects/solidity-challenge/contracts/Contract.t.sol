// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Contract} from "./Contract.sol";
import {Test} from "forge-std/Test.sol";

contract ContractTest is Test {
    event Winner(address winner);

    Contract _contract;

    function setUp() public {
        _contract = new Contract();
    }

    function test_whenSenderIsEOA_revert() public {
        address eoa = makeAddr("EOA");

        vm.prank(eoa, eoa);
        vm.expectRevert();
        _contract.attempt();
    }

    function test_whenSenderIsNotEOA_emitWinner() public {
        address eoa = makeAddr("EOA");
        address other = makeAddr("other");

        vm.prank(other, eoa);
        vm.expectEmit();
        emit Winner(other);
        _contract.attempt();
    }
}