import { describe, it } from 'node:test';
import { network } from 'hardhat';

describe('Contract', async () => {
    const { viem } = await network.create();

    it('Should emit the Winner event when calling the attempt() from a contract', async () => {
        const contract = await viem.deployContract('Contract');
        const attacker = await viem.deployContract('Attacker', [contract.address]);

        viem.assertions.emitWithArgs(
            attacker.write.attack(),
            contract,
            'Winner',
            [attacker.address]
        );
    });

    it('Should revert transaction when calling the attempt() from EOA', async () => {
        const contract = await viem.deployContract('Contract');
        viem.assertions.revertWith(contract.write.attempt(), 'msg.sender is equal to tx.origin');
    });
});