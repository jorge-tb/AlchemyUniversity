import { Eip1193Provider } from "ethers";
import { Address } from "../types/address";
type ProviderRpcErrorCode = 4001 | 4100 | 4200 | 4900 | 4901;

export interface Eip1193ProviderWithEvents extends Eip1193Provider {
    on<E extends keyof Eip1193Events>(event: E, listener: (...args: Eip1193Events[E]) => void): this;
    removeListener<E extends keyof Eip1193Events>(event: E, listener: (...args: Eip1193Events[E]) => void): this
}

export interface Eip1193Events {
    connect: [ProviderConnectInfo];
    disconnect: [ProviderRpcError],
    chainChanged: [string];
    accountsChanged: [Address[]];
    message: [ProviderMessage];
}

interface ProviderConnectInfo {
    readonly chainId: string;
}

interface ProviderRpcError extends Error {
    readonly code: ProviderRpcErrorCode;
    readonly data?: unknown;
}

interface ProviderMessage {
    readonly type: string;
    readonly data: unknown;
}