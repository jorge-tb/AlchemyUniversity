import { Address } from "@/app/ethereum/types/address"

type TOKEN_SPEC = 'erc20' | 'NATIVE_TOKEN';

export type ParamsOf<M extends keyof AlchemyRpcSchema['token']> = AlchemyRpcSchema['token'][M]['params'];

export interface AlchemyRpcSchema {
    token: {
        alchemy_getTokenAllowance: { params: [contract: Address, owner: Address, spender: Address], result: { result: string } },
        alchemy_getTokenBalances: { params: [address: Address, tokenSpec?: TOKEN_SPEC | Address[], options?: { pageKey: string, maxCount: number }], result: { address: Address, tokenBalances: { contractAddress: Address, tokenBalance: string }[] } },
        alchemy_getTokenMetadata: { params: [contractAddress: Address], result: { name: string, symbol: string, decimals: number, logo: string } }
    }
}