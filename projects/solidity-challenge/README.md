# Solidity Challenge — "Ready to be a winner?"

Alchemy University Ethereum Bootcamp, **Week 4** challenge.

## The goal

Emit the `Winner` event on the following contract:

```solidity
// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Contract {
    event Winner(address);

    function attempt() external {
        require(msg.sender != tx.origin, "msg.sender is equal to tx.origin");
        emit Winner(msg.sender);
    }
}
```

The original challenge targeted the **Goerli** testnet
(`0xcF469d3BEB3Fc24cEe979eFf83BE33ed50988502`). Goerli was deprecated in 2023,
so this project reproduces the exercise on **Sepolia** instead: the same
`Contract` source is redeployed and then solved.

## The catch

`attempt()` reverts unless `msg.sender != tx.origin`:

- `tx.origin` is always the **EOA** (externally-owned account) that signed and
  originated the transaction.
- `msg.sender` is the **immediate caller** — the account or contract one hop up
  the call stack.

When an EOA calls `attempt()` directly, `msg.sender == tx.origin` and the
`require` fails. The two values diverge **only when a contract sits between the
EOA and `Contract`**. Solving the challenge therefore means calling `attempt()`
*from another contract*.

See [`SOLUTION.md`](./SOLUTION.md) for how this project does it.

## Project layout

This is a [Hardhat 3](https://hardhat.org) project using `viem` and the native
Node.js test runner (`node:test`).

```
contracts/
  Contract.sol        The target contract (the one to beat).
  Attacker.sol        The intermediary contract that calls attempt().
  Contract.t.sol      Foundry-style Solidity unit tests.
test/
  Contract.ts         TypeScript integration tests (node:test + viem).
scripts/
  deploy-contract.ts  Deploys Contract to Sepolia, prints its address.
  deploy-attacker.ts  Deploys Attacker (pointed at Contract) and calls attack().
hardhat.config.ts
```

## Usage

### Run the tests

```shell
npx hardhat test            # all tests
npx hardhat test solidity   # Solidity unit tests only
npx hardhat test nodejs     # TypeScript integration tests only
```

### Reproduce the solve on Sepolia

You need a Sepolia-funded account. Its private key is read from the
`SEPOLIA_PRIVATE_KEY` configuration variable via the `hardhat-keystore` plugin:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then:

```shell
# 1. Deploy the target Contract — note the printed address.
npx hardhat run scripts/deploy-contract.ts

# 2. Put that address in CONTRACT_ADDRESS inside deploy-attacker.ts, then:
#    deploys Attacker pointed at Contract and calls attack() in one run.
npx hardhat run scripts/deploy-attacker.ts
```

The `Winner` event will be emitted on `Contract`, carrying the **Attacker
contract's** address (not the EOA's) as proof the bypass worked.
