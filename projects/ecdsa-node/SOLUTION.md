# SOLUTION — ECDSA Node (Weekly Project 1)

> Original challenge: see [README.md](./README.md).

My completed solution to the first weekly project of the Web3 roadmap: a client–server demo that uses **ECDSA signatures over secp256k1** to authorize transfers between accounts, without ever sending a private key to the server.

---

## What this project does

- A Node/Express server holds an in-memory ledger of three accounts (initial balances `100 / 50 / 75`).
- The React/Vite client lets the user check a balance and submit a transfer.
- Transfers are **signed client-side** with the sender's private key. The server recovers the public key from the signature, derives the address, verifies the signature against the hashed message, and only then debits/credits.
- Private keys never leave the browser. The server only ever sees `(signature, recipient, amount)`.

---

## Architecture

```
client (React + Vite)                  server (Express)
─────────────────────                  ─────────────────
Wallet.jsx     → GET /balance/:address → returns balances[address]
Transfer.jsx   → POST /send            → recover pubkey → verify sig → update ledger
   │
   ├─ build msg = { recipient, amount }
   ├─ msgHash = sha256(JSON.stringify(msg))
   ├─ sig = sign(msgHash, privKey, { format: 'recovered' })  // 65-byte recoverable sig
   └─ body = { sender: hex(sig), recipient, amount }
```

### Server: `server/account.js`

A small `Account` class that, on construction:
- generates a random private key (`secp.utils.randomPrivateKey()`),
- derives the public key (`secp.getPublicKey`),
- and computes a short **Ethereum-style address**: `'0x' + publicKeyHex.slice(-20)` (the extra-credit task from Phase 2).

### Server: `server/index.js`

The server boots three `Account` instances and seeds the `balances` map from their addresses, replacing the hardcoded `"0x1" / "0x2" / "0x3"` from the scaffold. The private keys are logged to the server console at startup so you can copy one into the client to play.

The `/send` handler implements **Phase 3**:

1. Receive `{ sender: hexSignature, recipient, amount }`.
2. Rebuild the canonical message `{ recipient, amount }`, JSON-stringify it, and `sha256` it. This must match exactly what the client hashed.
3. **Recover** the sender's public key from the signature + hash using `@noble/secp256k1`'s `recoverPublicKey(...)`.
4. Derive the sender address from the recovered public key (same `'0x' + hex.slice(-20)` rule).
5. **Verify** the signature against the hash and the recovered public key. Reject with `400 Invalid signature!` if verification fails.
6. If valid, debit the sender, credit the recipient, return new sender balance. Insufficient funds → `400 Not enough funds!`.

### Client: `client/src/Transfer.jsx`

- Treats the "wallet address" input as the **private key** (a deliberate dev-mode shortcut so I can paste any of the three server-generated keys; the project explicitly forbids private keys traveling to the server, and they don't — only the signature does).
- Builds the same `{ recipient, amount }` message, hashes it with sha256, and signs with `@noble/secp256k1` using `format: 'recovered'` so the server can later recover the public key.
- Wires up the noble v3 hash hooks (`hashes.sha256`, `hashes.hmacSha256`) because v3 expects the host to provide these.

---

## Cryptography choices and why

| Concern | Choice |
|---|---|
| Curve | secp256k1 (same curve Ethereum uses) |
| Library (server) | `@noble/secp256k1` v3 for `recoverPublicKey` / `verify`; `ethereum-cryptography` v1.2.0 for key gen / utils |
| Library (client) | `@noble/secp256k1` v3 for `sign` with recoverable format |
| Hash | `sha256` of the JSON-stringified `{ recipient, amount }` payload — same on both sides |
| Signature format | `recovered` (65 bytes = 64-byte compact sig + recovery byte) so the server doesn't need the public key out-of-band |
| Address format | Ethereum-style short address: last 20 hex chars of the uncompressed public key, prefixed with `0x` |

---

## What's secure here vs. what isn't

**Solved:**
- The server **cannot move funds without a valid signature** matching a known address.
- The private key never crosses the network. The client signs locally and sends only `(signature, recipient, amount)`.

**Knowingly NOT solved** (the project's "🤔" hint):
- **Replay protection.** The signed payload is just `{ recipient, amount }`. An attacker who observes a valid `/send` request can resubmit it verbatim and the server will happily debit the sender again. A real implementation would include a **nonce** (per-sender monotonic counter) or a `chainId`/timestamp in the signed message, and the server would reject reused or stale nonces.
- **Key handling on the client.** The dev UX still asks for the private key in a text box. In production, signing would happen in a wallet (MetaMask / WalletConnect) and the dapp would only request a signature.
- **Server state.** Balances live in-memory and reset on restart. Fine for the exercise; obviously not a real ledger.

---

## How to exercise the flow

After running the server and client per the [README](./README.md) setup instructions:

1. Paste a **private key** from the server logs into the "Wallet Address" box → the wallet panel will look up the balance using the derived address.
2. In the transfer panel, enter a recipient address (one of the other two from the server logs) and an amount.
3. Submit. The client signs the `{ recipient, amount }` hash with the private key and POSTs the signature; the server recovers the address, verifies, and updates balances.

A tampered or unsigned request returns `400 Invalid signature!`.

---

## File map

```
ecdsa-node/
├── client/
│   └── src/
│       ├── App.jsx          # layout, shared balance/address state
│       ├── Wallet.jsx       # balance lookup
│       ├── Transfer.jsx     # build msg → hash → sign → POST
│       └── server.js        # axios baseURL
└── server/
    ├── account.js           # Account class: keypair + Eth-style address
    └── index.js             # /balance, /send (recover + verify ECDSA)
```
