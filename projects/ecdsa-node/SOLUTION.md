# SOLUTION — ECDSA Node (Weekly Project 1)

> Original challenge: see [README.md](./README.md).

My completed solution to the first weekly project of the Web3 roadmap: a client–server demo that uses **ECDSA signatures over secp256k1** to authorize transfers between accounts, without ever sending a private key to the server.

---

## What this project does

- A Node/Express server holds an in-memory ledger of three accounts (initial balances `100 / 50 / 75`).
- The React/Vite client lets the user check a balance and submit a transfer.
- Transfers are **signed client-side** with the sender's private key. The server recovers the public key from the signature, derives the address, verifies the signature against the hashed message, and only then debits/credits.
- Replay protection: every signed message carries a `timestamp` and a 128-bit random `nonce`. The server rejects requests outside a ±5-minute window and rejects any `(senderPublicKey, nonce)` pair it has already seen.
- Private keys never leave the browser. The server only ever sees `(signature, recipient, amount, timestamp, nonce)`.

---

## Architecture

```
client (React + Vite)                  server (Express)
─────────────────────                  ─────────────────
Wallet.jsx     → GET /balance/:address → returns balances[address]
Transfer.jsx   → POST /send            → timestamp guard → recover pubkey
                                       → verify sig → replay guard → update ledger
   │
   ├─ build msg = { recipient, amount, timestamp, nonce }
   ├─ msgHash = sha256(JSON.stringify(msg))
   ├─ sig = sign(msgHash, privKey, { format: 'recovered' })  // 65-byte recoverable sig
   └─ body = { signature: hex(sig), recipient, amount, timestamp, nonce }
```

### Server: `server/account.js`

A small `Account` class that, on construction:
- generates a random private key (`secp.utils.randomPrivateKey()`),
- derives the public key (`secp.getPublicKey`),
- and computes a short **Ethereum-style address**: `'0x' + publicKeyHex.slice(-20)` (the extra-credit task from Phase 2).

### Server: `server/index.js`

The server boots three `Account` instances and seeds the `balances` map from their addresses, replacing the hardcoded `"0x1" / "0x2" / "0x3"` from the scaffold. The private keys are logged to the server console at startup so you can copy one into the client to play.

The `/send` handler implements **Phase 3** plus a replay guard:

1. Receive `{ signature, recipient, amount, timestamp, nonce }`.
2. **Timestamp guard** (cheap, stateless): reject if `|now − timestamp| > 5 min` → `400 Timestamp out of window`.
3. Rebuild the canonical message `{ recipient, amount, timestamp, nonce }`, JSON-stringify it, and `sha256` it. This must match exactly what the client hashed.
4. **Recover** the sender's public key from the signature + hash using `@noble/secp256k1`'s `recoverPublicKey(...)`.
5. Derive the sender address from the recovered public key (same `'0x' + hex.slice(-20)` rule).
6. **Verify** the signature against the hash and the recovered public key. Reject with `400 Invalid signature!` if verification fails.
7. **Replay guard** (only runs after the signature has authenticated the caller): if `NONCES_MEM[senderPublicKey]` already contains this `nonce` → `400 Replay detected`. Otherwise record `(nonce → timestamp)` under the sender's pubkey.
8. If still valid, debit the sender, credit the recipient, return new sender balance. Insufficient funds → `400 Not enough funds!`.

Why this order matters: the timestamp check is stateless so it runs first. The replay check writes to server memory, so it sits **after** signature verification — otherwise an unauthenticated attacker could fill `NONCES_MEM` with garbage. Nonces are keyed per sender (nested `Map<publicKey, Map<nonce, timestamp>>`), which is the right model: "has *this account* used *this nonce*?".

### Client: `client/src/Transfer.jsx`

- Treats the "wallet address" input as the **private key** (a deliberate dev-mode shortcut so I can paste any of the three server-generated keys; the project explicitly forbids private keys traveling to the server, and they don't — only the signature does).
- Builds the message `{ recipient, amount, timestamp: Date.now(), nonce: toHex(randomBytes(16)) }`, hashes it with sha256, and signs with `@noble/secp256k1` using `format: 'recovered'` so the server can later recover the public key.
- The `timestamp` and `nonce` are inside the signed hash, so an attacker can't strip or modify them without invalidating the signature.
- Wires up the noble v3 hash hooks (`hashes.sha256`, `hashes.hmacSha256`) because v3 expects the host to provide these.

---

## Cryptography choices and why

| Concern | Choice |
|---|---|
| Curve | secp256k1 (same curve Ethereum uses) |
| Library (server) | `@noble/secp256k1` v3 for `recoverPublicKey` / `verify`; `ethereum-cryptography` v1.2.0 for key gen / utils |
| Library (client) | `@noble/secp256k1` v3 for `sign` with recoverable format |
| Hash | `sha256` of the JSON-stringified `{ recipient, amount, timestamp, nonce }` payload — same on both sides |
| Signature format | `recovered` (65 bytes = 64-byte compact sig + recovery byte) so the server doesn't need the public key out-of-band |
| Address format | Ethereum-style short address: last 20 hex chars of the uncompressed public key, prefixed with `0x` |
| Replay protection | Timestamp window (±5 min) + random 128-bit nonce per message, tracked per sender in a nested in-memory `Map` |

---

## What's secure here vs. what isn't

**Solved:**
- The server **cannot move funds without a valid signature** matching a known address.
- The private key never crosses the network. The client signs locally and sends only `(signature, recipient, amount, timestamp, nonce)`.
- **Replay protection.** Both a timestamp window and a per-sender nonce store. The signed payload includes `timestamp` and `nonce`, so neither can be altered without invalidating the signature. Replays of the *same* request are rejected with `400 Replay detected`; requests stale or skewed beyond ±5 min are rejected with `400 Timestamp out of window`.
- **Check ordering.** Stateless rejects (timestamp) run before crypto. Stateful writes (nonce registration) run only after the signature has authenticated the caller — unauthenticated traffic can't grow `NONCES_MEM`.

**Knowingly NOT solved / future work:**
- **Nonce store cleanup.** `NONCES_MEM` grows unbounded — there's no sweep of entries older than the 5-min window. Per-sender scoping made it harder to abuse (only authed senders can write), but a long-running server still leaks memory. Two natural fixes: (a) lazy sweep inside `registerNonce` — drop expired entries from the sender's inner map before inserting; (b) periodic `setInterval` cleanup across all senders.
- **Map key choice.** Outer key is the uncompressed public-key hex (~130 chars) instead of the derived address (~22 chars). Both work; address would be cheaper and matches Ethereum's mental model.
- **Nonce model.** Currently random 128-bit nonces. Ethereum uses **monotonic per-account counters** — bounded memory (one int per account, no sweep), and the protocol I'd reach for in a real ledger. Worth swapping in once *Mastering Ethereum* Ch. 6 cements the model.
- **Key handling on the client.** The dev UX still asks for the private key in a text box. In production, signing would happen in a wallet (MetaMask / WalletConnect) and the dapp would only request a signature.
- **Server state.** Balances live in-memory and reset on restart. Fine for the exercise; obviously not a real ledger.

---

## How to exercise the flow

After running the server and client per the [README](./README.md) setup instructions:

1. Paste a **private key** from the server logs into the "Wallet Address" box → the wallet panel will look up the balance using the derived address.
2. In the transfer panel, enter a recipient address (one of the other two from the server logs) and an amount.
3. Submit. The client signs the `{ recipient, amount, timestamp, nonce }` hash with the private key and POSTs `(signature, recipient, amount, timestamp, nonce)`; the server checks the timestamp window, recovers the address, verifies the signature, checks the nonce hasn't been used by this sender, and updates balances.

Failure modes you can observe:
- Tampered or unsigned request → `400 Invalid signature!`
- Request older/newer than ±5 min → `400 Timestamp out of window`
- Same request replayed within the window → `400 Replay detected`

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
