import { Address } from "@/app/ethereum/types/address";

type TOKEN_SPEC = 'erc20' | 'NATIVE_TOKEN';

export interface TokenBalancesRequest {
    address: Address;
    tokenSpec?: TOKEN_SPEC | Address[];
    options?: { pageKey: string, maxCount: number };
}

export interface TokenBalanceResponse {
    address: Address;
    tokenBalances: { contractAddress: Address, tokenBalance: string }[];
}