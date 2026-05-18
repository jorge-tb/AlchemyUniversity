const axios = require('axios');
const niceList = require('../utils/niceList.json');
const MerkleTree = require('../utils/MerkleTree');

const serverUrl = 'http://localhost:1225';
const merkleTree = new MerkleTree(niceList);

console.log(`merkle root = ${merkleTree.getRoot()}`);

async function main() {
  const giftReceiver = process.argv.slice(2)[0];
  if (!giftReceiver)
    throw new Error('Required argument: name of the gifted');
  const receiverIdx = niceList.indexOf(giftReceiver);
  const proof = receiverIdx === -1 ? [] : merkleTree.getProof(receiverIdx);

  const { data: gift } = await axios.post(`${serverUrl}/gift`, {
    name: giftReceiver,
    proof
  });

  console.log({ gift });
}

main();