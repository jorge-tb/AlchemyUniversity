import { Address } from "@/app/ethereum/types/address";

export interface TokenMetadataRequest {
    contractAddress: Address;
}

export interface TokenMetadataResponse {
    name: string;
    symbol: string;
    decimals: number;
    logo: string;
}