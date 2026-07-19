'use client';

import { useEffect, useState } from 'react';
import { Eip6963AnnounceProviderEvent } from '@/ethereum/eip6963/Eip6963AnnounceProviderEvent';
import { Eip6963ProviderDetail } from '@/ethereum/eip6963/Eip6963ProviderDetail';
import { JsonRpcSigner, Network, ethers } from 'ethers';
import { getBalance, getTokenBalances } from '../actions/rpc';
import { Address, toAddress } from '@/ethereum/types/address';
import { Loader, withLoader } from '../components/Loader';
import { TokenBalanceExtended } from '../transactionals/token-balance-extended';
import { Eip1193ProviderWithEvents } from '@/ethereum/eip6963/Eip1193ProviderWithEvents';

export default function  WalletConnection() {
    const [wallets, setWallets] = useState(new Map<string, Eip6963ProviderDetail>());
    const [selected, setSelected] = useState<{ name: string, provider: Eip1193ProviderWithEvents | undefined }>();
    const [rpcSigner, setRpcSigner] = useState<JsonRpcSigner>();
    const [network, setNetwork] = useState<Network>();
    const [balance, setBalance] = useState<string>();
    const [tokenBalances, setTokenBalances] = useState<TokenBalanceExtended[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<Address[]>([]);

    useEffect(() => {
        if (window.ethereum) {
            console.log('User has a crypto wallet');

            window.addEventListener(
                'eip6963:announceProvider',
                ({ detail }: Eip6963AnnounceProviderEvent) => {
                    console.log('detail:', detail);
                    const eip6963Detail: Eip6963ProviderDetail = detail;
                    setWallets(prev => {
                        const next = new Map(prev);
                        next.set(eip6963Detail.info.name, eip6963Detail);
                        return next;
                    });

                    console.log(wallets.size);
                }
            );

            window.dispatchEvent(new Event("eip6963:requestProvider"));
        }
    }, []);

    const _configureListeners = (provider: Eip1193ProviderWithEvents) => {
        provider.on('connect', (e) => console.log('[Connect]', e));
        provider.on('disconnect', (e) => console.log('[Disconnect]', e));
        provider.on('chainChanged', (e) => {
            console.log('[ChainChanged]', e);
            setNetwork(Network.from(e));
        });
        provider.on('accountsChanged', (e) => {
            console.log('[AccountsChanged]', e);
            setAccounts(e);
        });
    }

    const connect = async (name: string) => {
        // Obtain EIP-6963 provider
        const selectedProvider = wallets.get(name)!.provider;
        setSelected({ name, provider: selectedProvider });

        // Configure event listeners
        _configureListeners(selectedProvider);

        // Build BrowserProvider
        const browserProvider = new ethers.BrowserProvider(selectedProvider);

        // Get RPC signer through popup wallet native flow
        const rpcSigner = await browserProvider.getSigner();
        setRpcSigner(rpcSigner);

        // Obtain network through Browser provider
        const network = await browserProvider.getNetwork();
        setNetwork(network);

        // Obtain balance through server + alchemy rpc provider
        const balance = await getBalance(toAddress(rpcSigner.address), network.chainId);
        setBalance(balance)
    }

    const loadTokenBalances = async () => {
        if (!rpcSigner)
            throw new Error(`User has to connect their account`);
        if (!network)
            throw new Error('Network undefined');

        // Obtain token balances through server + alchemy rpc provider
        const tokenPromise = getTokenBalances(toAddress(rpcSigner.address), network.chainId);
        const tokenBalances = await withLoader(tokenPromise, setIsLoading);
        setTokenBalances(tokenBalances);
    }

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Token Indexer</h1>
            <p className="text-sm text-muted">Connect a wallet to read its ERC-20 balances.</p>
        </header>
        { wallets.size ?
            <ul className="flex flex-wrap gap-3">
                { [...wallets.keys()].map((k, i) =>
                    <li key={wallets.get(k)?.info.uuid}>
                        <button
                            onClick={() => connect(k)}
                            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-accent hover:shadow-sm"
                        >
                        <img src={wallets.get(k)?.info.icon} alt={k} width={95} height={95} className="h-8 w-8 rounded-md"></img>
                        {k}
                        </button>
                    </li>)
                }
            </ul> :
            <p className="text-sm text-muted">No wallet detected. Install MetaMask or another browser wallet.</p>
        }
        {
            rpcSigner &&
            <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Connected account</p>
                <p className="mt-1 break-all font-mono text-sm">{rpcSigner.address}</p>
                <p className="mt-1 text-xs text-muted">via {selected?.name}</p>
            </div>
        }
        {
            network &&
            <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs uppercase tracking-wide text-muted">Connected to</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Name</dt>
                <dd className="font-medium">{network.name}</dd>
                <dt className="text-muted">Chain ID</dt>
                <dd className="font-mono">{network.chainId.toString()}</dd>
            </dl>
            </section>
        }
        {
            balance &&
            <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
                <p className="mt-1 font-mono text-lg font-semibold">{balance} <span className="text-sm font-normal text-muted">ETH</span></p>
            </div>
        }
        {
            selected &&
            <button
                onClick={() => loadTokenBalances()}
                className="self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
                Load ERC-20 token balances
            </button>
        }
        {
            isLoading && <div className="flex justify-center py-8"><Loader /></div>
        }
        {
            tokenBalances.length > 0 &&
            <section className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-muted">{tokenBalances.length} tokens</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                { tokenBalances.map((v, i) =>
                    <li key={v.contractAddress} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            { v.metadata.logo ?
                                <img src={v.metadata.logo} alt={v.metadata.symbol} className="h-8 w-8 rounded-full" /> :
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-xs font-semibold">
                                    {v.metadata.symbol?.slice(0, 3) || '?'}
                                </div>
                            }
                            <div className="min-w-0">
                                <p className="truncate font-medium">{v.metadata.symbol || 'Unknown'}</p>
                                <p className="truncate text-xs text-muted">{v.metadata.name || 'Unnamed token'}</p>
                            </div>
                        </div>
                        <p className="mt-3 font-mono text-lg font-semibold">{v.tokenBalance}</p>
                        <p className="mt-2 break-all font-mono text-[11px] text-muted">{v.contractAddress}</p>
                    </li>
                )}
                </ul>
            </section>
        }
        </main>
    );
}