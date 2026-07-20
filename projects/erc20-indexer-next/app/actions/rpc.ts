'use server'

import { JsonRpcProvider, formatEther } from "ethers"
import { ChainId } from "@/app/ethereum/constants/chainId";
import { AlchemyTokenProvider } from "../alchemy/alchemy-token-provider";
import { Address } from "@/app/ethereum/types/address";
import { TokenBalanceExtended } from "../transactionals/token-balance-extended";
import { ethers, isError } from 'ethers';
import { withRetry } from "../utils/retry";

const {
    ALCHEMY_API_KEY,
    ALCHEMY_ETH_MAINNET_RPC_URL,
    ALCHEMY_ETH_SEPOLIA_RPC_URL
} = process.env;

if (!ALCHEMY_API_KEY || !ALCHEMY_ETH_MAINNET_RPC_URL || !ALCHEMY_ETH_SEPOLIA_RPC_URL) {
    throw new Error('Missing Alchemy env vars');
}

const isTimeout = (err: unknown): boolean => isError(err, 'TIMEOUT');

const mainnetProvider = new JsonRpcProvider(ALCHEMY_ETH_MAINNET_RPC_URL + ALCHEMY_API_KEY, ChainId.Mainnet, { staticNetwork: true });
const sepoliaProvider = new JsonRpcProvider(ALCHEMY_ETH_SEPOLIA_RPC_URL + ALCHEMY_API_KEY, ChainId.Sepolia, { staticNetwork: true });

export async function getBalance(address: Address, chainId: bigint) {
    // Select RPC provider
    const rpcProvider = resolveRpcProvider(chainId);

    // Call getBalance
    const { result: balance } = await withRetry(() => rpcProvider.getBalance(address), isTimeout, 3);

    // Return balance in ETH
    return formatEther(balance);
}

export async function getTokenBalances(address: Address, chainId: bigint) {
    // Create Alchemy Token Provider
    const alchemyTokenProvider = new AlchemyTokenProvider(resolveRpcProvider(chainId));

    // Call Alchemy
    let { tokenBalances } = await alchemyTokenProvider.getTokenBalances({ address });

    // Extend token balances with metadata
    const metadataTasks = tokenBalances.map(async (tBalance, i) => {
        // Call Alchemy
        return alchemyTokenProvider.getTokenMetadata({ contractAddress: tBalance.contractAddress })
            .then(res => ({
                contractAddress: tBalance.contractAddress,
                tokenBalance: ethers.formatUnits(BigInt(tBalance.tokenBalance), res.decimals),
                metadata: { name: res.name, symbol: res.symbol, logo: res.logo }
            }) as unknown as TokenBalanceExtended);
    });

    // Return token balances with metadata
    return await Promise.all(metadataTasks);
}

function resolveRpcProvider(chainId: bigint) {
    switch(chainId) {
        case ChainId.Mainnet:
            return mainnetProvider;
        case ChainId.Sepolia:
            return sepoliaProvider;
        default:
            throw new Error(`Blockchain with chainId=${chainId} not supported`);
    }
}

