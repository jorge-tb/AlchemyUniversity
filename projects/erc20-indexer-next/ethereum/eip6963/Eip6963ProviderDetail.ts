import { Eip6963ProviderInfo } from "ethers";
import { Eip1193ProviderWithEvents } from "./Eip1193ProviderWithEvents";

export interface Eip6963ProviderDetail {
    info: Eip6963ProviderInfo;
    provider: Eip1193ProviderWithEvents;
}