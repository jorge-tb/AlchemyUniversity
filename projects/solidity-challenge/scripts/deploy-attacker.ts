import { network } from "hardhat";

const CONTRACT_ADDRESS = '0x17b6fb601fa3de1924c8f1ba093cb53192efd5de';
const { viem } = await network.create('sepolia');

console.log('Connected to Sepolia network');

const attacker = await viem.deployContract('Attacker', [CONTRACT_ADDRESS]);

console.log('Attacker contract address: ', attacker.address);

// Let's write on attacker's attack() method
const hash = await attacker.write.attack();
const publicClient = await viem.getPublicClient();
const txReceipt = await publicClient.waitForTransactionReceipt({ hash });

console.log('Logs from txReceipt of attack() call: ', txReceipt.logs);
