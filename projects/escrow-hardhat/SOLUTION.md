# SOLUTION — Decentralized Escrow (Weekly Project 5)

> Original challenge: see [README.md](./README.md).

My write-up of how I extended Alchemy's escrow scaffold and which of the five
proposed challenges I tackled, with pointers to the code that does each job.

The contract itself is unchanged from the scaffold — a depositor funds an
`Escrow` naming an arbiter and a beneficiary, and only the arbiter can
`approve()` to release the balance (`contracts/Escrow.sol`). All my work is in
the front-end and a new persistence server.

---

## Challenge 1 — Run on a live testnet (Sepolia)

**Done, no code changes.** The front-end deploys with whatever signer MetaMask
exposes (`deploy.js` builds an `ethers.ContractFactory` from the connected
signer), so the target network is purely a MetaMask setting.

How I ran it:

1. Switched MetaMask to the **Sepolia** network.
2. Funded the account from a Sepolia faucet.
3. Deployed and approved escrows from the same UI used locally.

Because deployment rides on the injected provider, going from the local Hardhat
node to Sepolia needed nothing but a network switch in the wallet — exactly the
"no-code" shape the challenge hints at. The persistence server (Challenge 4) is
pointed at Sepolia, so it indexes these same deployments.

---

## Challenge 2 — Stylize

**Done.** The default create-react-app look was replaced with a custom,
responsive UI (`app/src/index.css`, ~480 lines; layout in `app/src/App.js`):

- A branded header with a live **wallet status pill** (Connected / Connecting…)
  and the truncation-free connected address.
- A two-panel grid: *New Contract* on the left, *Existing Contracts* on the
  right, each with empty-states.
- Status-aware contract cards (`app/src/Escrow.js`) with a Pending/Approved
  badge, the arbiter/beneficiary addresses, and the value rendered as `Ξ`.

---

## Challenge 3 — Wei → Ether conversion

**Done.** The deposit input now takes **Ether**, and the conversion happens in
app code before deployment:

- On deploy, the entered amount is parsed with
  `ethers.utils.parseEther(...)` into wei before being sent to the contract
  (`app/src/App.js`, `newContract()`).
- On display, the stored wei value is formatted back with
  `ethers.utils.formatEther(value)` (`app/src/Escrow.js`).

So wei is the wire/storage format and Ether is what the user types and sees.

---

## Challenge 4 — Persistence

**Done — and deliberately stateless.** Instead of a database that records each
deployment, the server **reconstructs** an account's escrows directly from
on-chain data. That means the list survives a page refresh *and* a server
restart, because the chain is the only source of truth.

### How the server finds escrows

```
GET /contracts/:deployer
   │
   ├─ getAssetTransfers(EXTERNAL, fromAddress = deployer)   ← every tx the account sent
   │      for each tx:
   │        ├─ receipt.contractAddress                       ← was a contract created?
   │        └─ getCode(addr) === Escrow.deployedBytecode     ← is it *our* Escrow?
   │
   └─ for each matched escrow:
        ├─ read depositor / arbiter / beneficiary / isApproved   (minimal ABI)
        └─ getTransaction(deployTx).value                        (original deposit, wei)
              ▼
        [{ address, value, depositor, arbiter, beneficiary, isApproved }, …]
```

Code map:

- `server/index.js` — the Express route. Builds a Sepolia Alchemy client, runs
  the service, and wraps everything in `try/catch` → `502` on RPC failure so a
  flaky provider can't crash the process.
- `server/alchemy-client-factory.js` — creates an Alchemy SDK client for a given
  network (used here with `Network.ETH_SEPOLIA`).
- `server/escrow-service.js`:
  - `_findInfo(deployer)` — pages through the deployer's external transfers,
    resolves each tx's `contractAddress`, and keeps only addresses whose on-chain
    runtime code **fingerprint-matches** the compiled `Escrow` bytecode. That
    bytecode comparison is what tells an Escrow apart from any other contract the
    account deployed.
  - `find(deployer)` — for each match, reads the four public fields via a minimal
    ABI and pulls the **original deposit** from the deploy transaction's `value`
    (the live balance is `0` once approved, so the tx value is the faithful
    figure). Returns it as a wei string.
- `server/contract.js` — the DTO carrying `address`, `value`, `depositor`,
  `arbiter`, `beneficiary`, `isApproved`.

### How the front-end consumes it

- On wallet connect **and** on every MetaMask `accountsChanged` event, the app
  fetches `/contracts/<account>` and rebuilds each result into the same card
  shape used for freshly-deployed escrows (`app/src/App.js`, `loadDeployed`).
- Each loaded escrow is rehydrated into an `ethers.Contract` so the **Approve**
  button and the `Approved` event listener keep working on contracts that
  weren't deployed in the current session.
- The browser reaches the server through the CRA dev `proxy`
  (`"proxy": "http://localhost:4000"` in `app/package.json`), so the front-end
  uses relative `/contracts/...` URLs and there's no CORS to manage in dev.
- The server reads `ALCHEMY_API_KEY` / `PORT` from the root `.env` via
  `node --env-file=../.env` (the `start` script) — no `dotenv` dependency.

---

## Challenge 5 — What else?

Beyond the four above, I added some UX and robustness polish:

- **Filter by status.** The Existing Contracts panel has *all / pending /
  approved* tabs with live counts (`app/src/App.js`), so a long list stays
  navigable.
- **Live account switching.** An `accountsChanged` listener re-syncs the signer
  and re-loads that account's escrows when you switch accounts in MetaMask, and
  clears the list on lock/disconnect — no manual refresh.
- **Resilient fetch.** A failed server call is caught and logged, leaving the UI
  intact rather than blanking the page; the server answers with a clean `502`
  instead of an unhandled rejection.

---

## In scope vs. out of scope

**In scope — done:** testnet deploy (Sepolia), custom UI, Ether input,
refresh-proof persistence via a stateless indexing server, status filtering and
live account sync.

**Out of scope / known limitations — flagging for future me:**

- **Funded-deploy assumption.** `_findInfo` discovers escrows via *external ETH
  transfers*, so a zero-value deployment (no ETH moved) wouldn't be indexed.
  Every escrow here carries a deposit, so it holds in practice.
- **Exact-bytecode match.** The fingerprint compares against the locally compiled
  `deployedBytecode`; a contract compiled with different settings (different
  metadata hash) wouldn't match. Fine for self-deployed escrows.
- **No caching, N+1 RPC calls.** Each request re-scans transfers and reads each
  contract. Acceptable at study scale; a real indexer would cache or use logs.
- **Sepolia-only.** The network is hard-wired in `server/index.js`.
- **Approve only succeeds for the arbiter.** The endpoint returns contracts where
  you're the *depositor*, but `approve()` requires `msg.sender == arbiter`. The
  button is still shown on those cards (matching session-deployed ones); clicking
  as a non-arbiter reverts, by contract design.

These gaps are deliberate — the project is about wiring a front-end and a
chain-derived persistence layer to the escrow contract, not about shipping a
hardened indexer.

---

## How to run end-to-end

```shell
# terminal 1 — persistence server (Sepolia)
cd server && npm start         # :4000, loads ../.env

# terminal 2 — front-end
cd app && npm start            # :3000, proxies /contracts → :4000
```

Connect MetaMask (on Sepolia), deploy an escrow, refresh the page — it
reappears, fetched back from the chain.

## Tests

```shell
npx hardhat test
```

`test/test.js` asserts the escrow is funded on deploy, that approval transfers
the balance to the beneficiary, and that the arbiter-only guard holds.
