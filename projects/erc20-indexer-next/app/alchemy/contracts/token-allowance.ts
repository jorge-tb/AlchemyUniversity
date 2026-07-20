import { Address } from "@/app/ethereum/types/address";

export interface TokenAllowanceRequest {
    contract: Address;
    owner: Address;
    spender: Address;
}

export interface TokenAllowanceResponse {
    result: string;
}