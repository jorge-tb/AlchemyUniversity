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
        <>
        <p>Connect your wallet</p>
        { wallets.size ? 
            <ul>
                { [...wallets.keys()].map((k, i) => 
                    <li key={wallets.get(k)?.info.uuid}>
                        <button onClick={() => connect(k)}>
                        <img src={wallets.get(k)?.info.icon} alt={k} width={95} height={95}></img>
                        {k}
                        </button>
                    </li>) 
                }
            </ul> :
            <p>There's no available wallet</p>
        }
        {
            rpcSigner && <p>{rpcSigner.address} with {selected?.name}</p>  
        }
        {
            network && 
            <section>
            <h2>Connected to</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem', margin: 0 }}>
                <dt>Name</dt>
                <dd style={{ margin: 0 }}>{network.name}</dd>
                <dt>Chain ID</dt>
                <dd style={{ margin: 0 }}>{network.chainId.toString()}</dd>
            </dl>
            </section>
        }
        {
            balance && <p>Balance: {balance} Sepolia ETH</p>
        }
        {
            selected && <button onClick={() => loadTokenBalances()}>Load ERC-20 Token Balances</button> 
        }
        {
            isLoading && <Loader />
        }
        {
            tokenBalances.length > 0 && 
            <ul>
                { tokenBalances.map((v, i) =>
                    <li key={v.contractAddress}>
                        Contract: {v.contractAddress}
                        <br />
                        Balance: {v.tokenBalance}
                        <br />
                        Metadata: {JSON.stringify(v.metadata)}
                    </li>
                )}
            </ul>
        }
        </>
    );
}