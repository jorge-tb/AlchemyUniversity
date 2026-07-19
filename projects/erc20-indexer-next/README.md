# ERC-20 Token Indexer — from-scratch build

My take on the **Alchemy University Ethereum bootcamp, Week 6** ERC-20 indexer
challenge. Instead of cloning [Alchemy's starter
repo](https://github.com/alchemyplatform/erc20-indexer) and extending it, I
rebuilt the whole thing from an empty `create-next-app` — no `alchemy-sdk`, no
starter code — to actually understand the layers the challenge normally hides.

Connect a browser wallet → the app reads its native balance and every ERC-20 it
holds, with token metadata (symbol, name, logo).

---

## Why this is harder than the original challenge

The AU challenge hands you a working app and asks you to bolt features on top:
add wallet connect, a loading spinner, some styling, error handling, ENS. All of
the actual chain work is a one-line `alchemy-sdk` call, and the API key is pasted
straight into a client component.

This version rebuilds those foundations instead of consuming them:

| Concern | AU starter | This build |
| --- | --- | --- |
| Chain access | `alchemy-sdk` one-liners | **Hand-written typed JSON-RPC client** over `ethers` `provider.send()` |
| API key | Pasted into `App.jsx`, shipped to the browser | **Server Actions (`'use server'`)** — key never leaves the server |
| Wallet discovery | `window.ethereum` (single injected wallet) | **EIP-6963** multi-wallet enumeration |
| Language | Plain JSX | **TypeScript**, strict — branded `Address` type, typed EIP-1193 events |
| Chains | Mainnet only | **Multi-chain**, provider resolved by `chainId` (mainnet / Sepolia) |
| Framework | Vite SPA | Next.js App Router (server + client components) |

Each row is a deliberate step down a layer:

- **Typed RPC client** (`app/alchemy/`) — I defined the Alchemy JSON-RPC method
  schema (`alchemy_getTokenBalances`, `alchemy_getTokenMetadata`,
  `alchemy_getTokenAllowance`) as a TypeScript contract, so params and results
  are checked at compile time. `alchemy-sdk` hides exactly this; writing it means
  understanding it.
- **Server-side key handling** — the starter's biggest flaw is that its Alchemy
  key is exposed to anyone who opens dev tools. Here, balance/metadata calls run
  in Server Actions, so the key stays server-only.
- **EIP-6963** — the modern wallet-discovery standard. Instead of grabbing
  whatever injected itself into `window.ethereum`, the app enumerates every
  announced provider and lets the user pick — the correct behaviour when someone
  has MetaMask *and* Rabby *and* Coinbase Wallet installed.

## Honest tradeoffs

The original challenge, done well, ends up as a *more finished product* — polished
styling, ENS input resolution, query-speed tweaks. This build deliberately spends
its effort on **architecture and protocol depth** rather than product polish:

- UI is intentionally clean-minimal, not a design showcase.
- ENS resolution and query-speed optimisation aren't implemented yet.
- The wallet page still carries a couple of known TypeScript gaps (global
  `window.ethereum` typing, an EIP-6963 `CustomEvent` cast) — visible in
  `next build`, harmless in `next dev`. Left in the open on purpose: this is a
  learning build, and I'd rather show the seams than hide them.

## Architecture

```
app/
  actions/rpc.ts              Server Actions: getBalance, getTokenBalances (key stays here)
  alchemy/
    alchemy-token-provider.ts Typed wrapper over ethers provider.send()
    contracts/                Alchemy JSON-RPC request/response + method schema
  transactionals/             View model returned to the client (TokenBalanceExtended)
  wallet/page.tsx             Client component: EIP-6963 discovery, connect, render
  components/Loader.tsx       Loading indicator
ethereum/
  eip6963/                    EIP-6963 + typed EIP-1193 provider/event interfaces
  types/address.ts            Branded Address type with runtime validation
  constants/chainId.ts        Supported chains
```

The data flow: **client** picks a wallet (EIP-6963) and connects via ethers
`BrowserProvider` → **Server Action** resolves the right Alchemy RPC provider by
`chainId` and calls the typed `AlchemyTokenProvider` → token balances are
enriched with metadata and returned as a typed view model → **client** renders.

## Running locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> (the root redirects to `/wallet`).

Create a `.env` with your Alchemy credentials — these are read **server-side
only**:

```
ALCHEMY_API_KEY=your_key
ALCHEMY_ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/
ALCHEMY_ETH_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · ethers v6
