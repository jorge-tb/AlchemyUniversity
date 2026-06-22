# Decentralized Escrow Application

Alchemy University Ethereum Bootcamp, **Week 5** weekly project.

An Escrow dApp built with [Hardhat](https://hardhat.org/): a depositor locks
funds in an `Escrow` contract naming an arbiter and a beneficiary; only the
**arbiter** can `approve()`, which releases the full balance to the
beneficiary. A React front-end deploys and interacts with these contracts, and
a small Express server reconstructs an account's previously-deployed escrows
straight from on-chain data so they survive a page refresh.

> The base scaffold comes from
> [alchemyplatform/escrow-hardhat](https://github.com/alchemyplatform/escrow-hardhat).
> What I added on top — and how each proposed challenge was met — is written up
> in [`SOLUTION.md`](./SOLUTION.md).

## The challenges

| # | Challenge | Status |
|---|-----------|--------|
| 1 | Run the dApp on a live testnet (Sepolia) | ✅ done — no-code, via MetaMask |
| 2 | Stylize the application | ✅ done — custom modern UI |
| 3 | Accept the deposit in Ether instead of Wei | ✅ done |
| 4 | Persistence — survive a page refresh | ✅ done — stateless indexing server |
| 5 | What else? | ✅ status filters + live account sync + resilient fetch |

See [`SOLUTION.md`](./SOLUTION.md) for the per-challenge write-up.

## Project layout

```
contracts/   Escrow.sol — the escrow smart contract
test/        test.js — Hardhat + chai unit tests
app/         React front-end (deploy, approve, list, filter)
server/      Express server — /contracts/:address indexing endpoint
hardhat.config.js
```

Compiling places the contract artifact under `app/src/artifacts/…` (configured
in `hardhat.config.js`) so the front-end *and* the server can read the ABI and
bytecode.

## Setup

Install dependencies in three places — the root (Hardhat), the app, and the
server:

```shell
npm install
cd app && npm install
cd ../server && npm install
```

Create a `.env` in the project root (it is git-ignored):

```
ALCHEMY_API_KEY=<your Alchemy key>
PORT=4000
```

## Running locally (Hardhat node)

```shell
# 1. Local blockchain (chain id 31337, RPC on http://127.0.0.1:8545)
npx hardhat node

# 2. Compile the contract → artifact lands in app/src/artifacts
npx hardhat compile

# 3. Front-end
cd app && npm start          # http://localhost:3000
```

Import one of the funded private keys printed by `npx hardhat node` into
MetaMask, point MetaMask at the local network (RPC `http://127.0.0.1:8545`,
chain id `31337`), then deploy and approve escrows from the UI. The account you
sign with is the **depositor**; switch to the **arbiter** account to approve.

## Running against Sepolia

No code changes required — switch the MetaMask network to **Sepolia**, fund the
account from a [Sepolia faucet](https://sepoliafaucet.com/), and deploy from the
same UI. The persistence server is wired to query Sepolia (see below).

## Persistence server

The server reconstructs an account's deployed escrows from the chain — no
database — so the list survives both a browser refresh and a server restart.

```shell
cd server && npm start        # loads ../.env, listens on PORT (4000)
```

`GET /contracts/:address` returns the Escrow contracts deployed by `:address`
on Sepolia. The front-end calls it on wallet connect (and on every MetaMask
account switch) through the dev `proxy` configured in `app/package.json`.

## Tests

```shell
npx hardhat test
```

`test/test.js` covers funding, the arbiter-only approval path, and the balance
transfer to the beneficiary.
