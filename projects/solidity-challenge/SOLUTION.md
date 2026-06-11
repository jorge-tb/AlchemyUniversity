# Solution — Emitting the `Winner` event

## Core idea

`Contract.attempt()` guards on `msg.sender != tx.origin`. Those two are equal
exactly when an EOA calls the function directly, because then the EOA is *both*
the transaction originator (`tx.origin`) and the immediate caller
(`msg.sender`). They diverge the moment a **contract** is interposed between the
EOA and `Contract`:

```
EOA ──tx──▶ Attacker ──internal call──▶ Contract.attempt()
            (msg.sender)                (tx.origin = EOA)
```

Inside `attempt()` during the solve:

- `tx.origin` = my EOA (unchanged for the whole transaction).
- `msg.sender` = the **Attacker** contract.

`msg.sender != tx.origin` holds, the `require` passes, and `Winner(msg.sender)`
fires with the Attacker's address.

## The intermediary contract

[`contracts/Attacker.sol`](./contracts/Attacker.sol) — a minimal proxy that
holds a typed reference to `Contract` and forwards one call:

```solidity
contract Attacker {
    Contract _contract;

    constructor(address contractAddress) {
        _contract = Contract(contractAddress);
    }

    function attack() public {
        _contract.attempt();
    }
}
```

That's the entire trick: `attack()` makes the call *from contract code*, so the
EVM sets `msg.sender` to the Attacker's address rather than my wallet's.

## How it was deployed and solved on Sepolia

The original challenge lived on Goerli, which was deprecated in 2023. I
reproduced the same `Contract` on **Sepolia** and solved it there.

1. **Deploy the target.** [`scripts/deploy-contract.ts`](./scripts/deploy-contract.ts)
   deploys `Contract` and logs its address.
2. **Deploy the attacker and fire.** [`scripts/deploy-attacker.ts`](./scripts/deploy-attacker.ts)
   deploys `Attacker` with the target address in its constructor, then calls
   `attacker.write.attack()` from my EOA and waits for the receipt, printing the
   emitted logs.

### On-chain result

| Role            | Address |
| --------------- | ------- |
| Target `Contract` | `0x17b6fB601Fa3De1924c8F1ba093CB53192Efd5De` |
| `Attacker`        | `0xa4BD778452a53812bd6e8FD9D89300Aa64eF0f05` |

The `Winner` event was emitted **on the target `Contract`** (Sepolia block
`11037824`), and its `address` argument is the **Attacker contract's** address
(`0xa4BD778452a53812bd6e8FD9D89300Aa64eF0f05`) — not my EOA. That is the proof
the bypass worked: had the call come straight from the EOA, the transaction
would have reverted before reaching `emit`.

Block explorer links:

- Target Contract — https://sepolia.etherscan.io/address/0x17b6fB601Fa3De1924c8F1ba093CB53192Efd5De#events
- Attacker — https://sepolia.etherscan.io/address/0xa4BD778452a53812bd6e8FD9D89300Aa64eF0f05

## Tests

Two layers, both asserting the same behaviour from different angles:

- **Solidity** ([`contracts/Contract.t.sol`](./contracts/Contract.t.sol)) — uses
  `vm.prank(caller, origin)` (the two-argument form sets *both* `msg.sender` and
  `tx.origin`) to drive the two cases:
  - `msg.sender == tx.origin` → reverts.
  - `msg.sender != tx.origin` → emits `Winner` with the caller's address.
- **TypeScript** ([`test/Contract.ts`](./test/Contract.ts)) — `node:test` + viem,
  deploying the real `Attacker` and asserting `Winner` is emitted with the
  Attacker's address, plus the EOA-revert path.

## Why this guard is a known anti-pattern

`require(msg.sender != tx.origin)` (and its inverse, `msg.sender == tx.origin`,
used to mean "only EOAs, no contracts") is **not** a reliable way to distinguish
humans from contracts:

- Account abstraction (**EIP-4337**) routes user operations through a bundler
  and an entry-point/smart-account, so a legitimate "user" call arrives with
  `msg.sender != tx.origin` anyway.
- **EIP-7702** lets a normal EOA temporarily carry contract code within a
  transaction, blurring the EOA/contract distinction further.

It survives here only because this is a deliberately solvable puzzle. In
production it both breaks composability (rejecting honest contract callers) and
fails to deliver the security property it appears to promise.
