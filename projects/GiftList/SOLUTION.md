# SOLUTION — Gift List (Weekly Project 2)

> Original challenge: see [README.md](./README.md).

My completed solution to the second weekly project of the Web3 roadmap: a client–server demo where the client proves membership of a name in a **Merkle tree** to a server that only knows the **Merkle root**.

---

## What this project does

- The "nice list" is a 1000-entry array of names (`utils/niceList.json`).
- The **client is the prover**: it has the full list, builds the Merkle tree, finds the index of the gift receiver, and generates a Merkle proof for that leaf.
- The **server is the verifier**: it has *only* the precomputed root hardcoded in source. No list, no tree.
- The client POSTs `{ name, proof }`; the server runs `verifyProof` against its hardcoded root and either grants the gift or rejects.

---

## Architecture

```
client (Node script)                    server (Express)
────────────────────                    ─────────────────
node client/index <name>
   │
   ├─ build MerkleTree from niceList
   ├─ idx = niceList.indexOf(name)
   ├─ proof = idx === -1 ? [] : tree.getProof(idx)
   └─ POST /gift { name, proof }  ───►  verifyProof(proof, name, MERKLE_ROOT)
                                          ├─ hit  → "You got a toy robot!"
                                          └─ miss → "You are not on the list :("
```

### Client: `client/index.js`

- Reads the receiver's name from `process.argv` and throws early if missing (`client/index.js:12–13`).
- Builds the Merkle tree from `niceList.json` and logs the computed root for sanity-checking against the server's hardcoded value.
- If the name isn't in the list, sends `proof: []` instead of crashing. The server's `verifyProof` will still produce the correct `false` result (because `keccak256(name)` won't equal the root on its own).
- POSTs `{ name, proof }` to `http://localhost:1225/gift`.

### Server: `server/index.js`

- Hardcodes the Merkle root at `server/index.js:11`:
  `ddd59a2ffccddd60ff47993312821cd57cf30f7f14fb82937ebe2c4dc78375aa`
  This matches `new MerkleTree(niceList).getRoot()` — verified by recomputation.
- Single `POST /gift` endpoint: pulls `{ name, proof }` from the body, calls `verifyProof(proof, name, MERKLE_ROOT)`, and returns one of two strings.
- The server has no copy of the list. The root alone is enough to verify membership — that's the whole point of the exercise.

### Utils (provided by the scaffold, unchanged)

- `utils/MerkleTree.js` — `keccak256`-based binary tree; exposes `getRoot()` and `getProof(index)`.
- `utils/verifyProof.js` — walks the proof, hashing `keccak256(leaf)` upward with each sibling, and compares the final hash to the root.
- `utils/niceList.json` — 1000 names.
- `utils/example.js` — sanity script showing the round trip.

---

## Cryptography choices and why

| Concern | Choice |
|---|---|
| Hash | `keccak256` (same hash Ethereum uses for everything Merkle-adjacent) |
| Tree shape | Binary; odd-leaf layers promote the unpaired leaf upward unchanged |
| Proof format | Array of `{ data: hex, left: bool }` — `left` tells the verifier which side the sibling sits on |
| Library | `ethereum-cryptography` v1.x for `keccak256` + hex utils |
| Trust model | Server trusts only the root; client supplies leaf + proof |

---

## What's verified end-to-end

I tested three paths against the running tree and root:

| Case | Input | Result |
|---|---|---|
| Valid claim | name in list, real proof | `verifyProof → true`, "You got a toy robot!" |
| Empty proof | name not in list, `proof: []` | `verifyProof → false`, "You are not on the list :(" |
| Forged claim | name not in list, stolen proof from a different leaf | `verifyProof → false` (leaf hash doesn't match the path) |

---

## What's in scope vs. out of scope

**In scope (README requirements) — done:**
- Client computes and sends `{ name, proof }`.
- Server hardcodes `MERKLE_ROOT` and uses `verifyProof` against it.
- Server returns the gift on a valid proof, rejection otherwise.

**Out of scope for this exercise — flagging for future me:**
- **No identity binding.** Anyone who has the niceList can claim a gift for anyone in it. Real airdrops bind each leaf to an address and require `msg.sender == address`.
- **No claim tracking.** Server is stateless — same name can claim the gift unlimited times. Real airdrops mark each leaf as claimed.
- **Naive tree.** The provided `MerkleTree.js` has no leaf/node domain separation (leaves and internal nodes use the same `keccak256` with no tag byte) and promotes lone unpaired leaves upward unchanged. Standard libraries (OpenZeppelin `MerkleProof.sol`) avoid both. Not my code, but worth knowing it's there when reading real Merkle implementations later.

These are deliberate gaps — the challenge is about understanding the prover/verifier split, not building a hardened airdrop.

---

## How to exercise the flow

From the project root:

```
npm install
node server/index          # listens on :1225
node client/index "Edmond Carroll PhD"   # any name from niceList.json
node client/index "Santa Hacker"         # a name not in the list
```

Expected output:

```
$ node client/index "Edmond Carroll PhD"
merkle root = ddd59a2ffccddd60ff47993312821cd57cf30f7f14fb82937ebe2c4dc78375aa
{ gift: 'You got a toy robot!' }

$ node client/index "Santa Hacker"
merkle root = ddd59a2ffccddd60ff47993312821cd57cf30f7f14fb82937ebe2c4dc78375aa
{ gift: 'You are not on the list :(' }
```

---

## File map

```
GiftList/
├── client/
│   └── index.js            # prover: build tree, generate proof, POST /gift
├── server/
│   └── index.js            # verifier: hardcoded root + verifyProof
└── utils/                  # provided scaffold, unchanged
    ├── MerkleTree.js
    ├── verifyProof.js
    ├── niceList.json
    └── example.js
```
