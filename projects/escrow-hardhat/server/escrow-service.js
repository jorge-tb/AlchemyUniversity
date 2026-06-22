const { Alchemy, AssetTransfersCategory, Contract } = require('alchemy-sdk');
const { Contract: ContractDTO } = require('./contract.js');
const ESCROW_DEPLOYED_BYTECODE = require('./../app/src/artifacts/contracts/Escrow.sol/Escrow.json').deployedBytecode;


class EscrowService {
    /**
     * 
     * @param {Alchemy} alchemyClient 
     */
    constructor(alchemyClient) {
        this.alchemyClient = alchemyClient;
    }

    async find(deployer) {
        const escrowsInfo = await this._findInfo(deployer);
        const escrowAddresses = escrowsInfo.map(e => e.escrow);

        const abi = [
            "function isApproved() view returns (bool)",
            "function arbiter() view returns (address)",
            "function beneficiary() view returns (address)",
            "function depositor() view returns (address)",
        ];

        const contracts = [];
        const provider = await this.alchemyClient.config.getProvider();
        for (const addr of escrowAddresses) {
            const escrow = new Contract(addr, abi, provider);
            const properties = await Promise.all([
                await escrow.depositor(),
                await escrow.arbiter(),
                await escrow.beneficiary(),
                await escrow.isApproved()
            ]);
            contracts.push(new ContractDTO(...properties));
        }

        return contracts;
    }

    async _findInfo(deployer) {
        const escrows = [];
        const seen = new Set();
        let pageKey;

        do {
            const res = await this.alchemyClient.core.getAssetTransfers({
                fromBlock: '0x0', toBlock: 'latest',
                fromAddress: deployer,
                category: [AssetTransfersCategory.EXTERNAL],
                excludeZeroValue: false,
                pageKey
            });

            const isTheSameCode = (code) => code !== '0x' && code === ESCROW_DEPLOYED_BYTECODE;

            for (const t of res.transfers) {
                if (seen.has(t.hash)) continue;
                seen.add(t.hash);
                const addr = (await this.alchemyClient.core.getTransactionReceipt(t.hash))?.contractAddress;
                if (!addr) continue;

                const code = await this.alchemyClient.core.getCode(addr);
                if (isTheSameCode(code)) {
                    escrows.push({ escrow: addr, deployTx: t.hash, block: t.blockNum });
                }
            }
            pageKey = res.pageKey;
        } while(pageKey);

        return escrows;
    }
}

module.exports = {
    EscrowService
};




