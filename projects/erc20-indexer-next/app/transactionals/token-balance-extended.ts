import { Address } from "@/ethereum/types/address";

export interface TokenBalanceExtended {
    contractAddress: Address;
    tokenBalance: number;
    metadata: { name: string, symbol: string, logo: string};
}