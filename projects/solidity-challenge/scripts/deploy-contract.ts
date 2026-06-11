import { network } from 'hardhat';

const { viem } = await network.create('sepolia');

console.log('Connected to Sepolia network');

const contract = await viem.deployContract('Contract');

console.log('Contract contract address: ', contract.address);


