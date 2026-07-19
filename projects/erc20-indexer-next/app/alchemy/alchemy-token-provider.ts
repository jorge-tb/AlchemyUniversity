import { JsonRpcProvider } from "ethers";
import { TokenAllowanceRequest, TokenAllowanceResponse } from "./contracts/token-allowance";
import { TokenBalanceResponse, TokenBalancesRequest } from "./contracts/token-balances";
import { TokenMetadataRequest, TokenMetadataResponse } from "./contracts/token-metadata";
import { AlchemyRpcSchema, ParamsOf } from "./contracts/rpc-schema";

export class AlchemyTokenProvider {
    _rpcProvider: JsonRpcProvider;

    constructor(rpcProvider: JsonRpcProvider) {
        this._rpcProvider = rpcProvider;
    }

    async getTokenAllowance(request: TokenAllowanceRequest): Promise<TokenAllowanceResponse> {
        return this._tokenRequest('alchemy_getTokenAllowance', [request.contract, request.owner, request.spender]);
    }

    async getTokenBalances(request: TokenBalancesRequest): Promise<TokenBalanceResponse> {
        const tokenSpec = request.tokenSpec ?? 'erc20';
        const params: ParamsOf<'alchemy_getTokenBalances'> = request.options ?
            [request.address, tokenSpec, request.options] :
            [request.address, tokenSpec]
        return this._tokenRequest('alchemy_getTokenBalances', params);
    }

    async getTokenMetadata(request: TokenMetadataRequest): Promise<TokenMetadataResponse> {
        return this._tokenRequest('alchemy_getTokenMetadata', [request.contractAddress]);
    }

    _tokenRequest<M extends keyof AlchemyRpcSchema['token']>(
        method: M,
        params: AlchemyRpcSchema['token'][M]['params'],
    ): Promise<AlchemyRpcSchema['token'][M]['result']> {
        return this._rpcProvider.send( method, params );
    }
}