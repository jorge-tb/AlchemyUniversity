const secp = require('ethereum-cryptography/secp256k1');
const secpNoble = require('@noble/secp256k1');
const { hexToBytes, toHex, utf8ToBytes } = require('ethereum-cryptography/utils');
const { sha256 } = require('ethereum-cryptography/sha256');
const { Account } = require('./account.js');
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

// const balances = {
//   "0x1": 100,
//   "0x2": 50,
//   "0x3": 75,
// };

const funds = [100, 50, 75];
const accounts = Array.from({ length: 3 }, (_, i) => new Account(funds[i]));
const balances = accounts.reduce((prev, account) => {
  prev[account.address] = account.funds;
  return prev;
}, {});

console.log(`accounts: ` + accounts.map(a => a.toString()));
console.log(`balances: ` + JSON.stringify(balances));

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  // phase 1
  //const { sender, recipient, amount } = req.body;

  // phase 2
  // const { sender: senderPrivateKey, recipient, amount } = req.body;

  // phase 2: sender = sender's private key
  // const senderPrivateKeyBytes = hexToBytes(senderPrivateKey);
  // const senderPublicKeyBytes = secp.getPublicKey(senderPrivateKeyBytes);
  // const senderPublicKey = toHex(senderPublicKeyBytes);
  // const sender = '0x' + senderPublicKey.slice(-20);

  // phase 3
  const { sender: senderSignature, recipient, amount } = req.body;

  // phase 3 -- recover public key from digital signature
  const senderSignatureToBytes = hexToBytes(senderSignature);
  const msg = { recipient: recipient, amount: amount };
  const msgBytes = utf8ToBytes(JSON.stringify(msg));
  const msgHash = sha256(msgBytes);

  console.log(`hex msgHash -> ${toHex(msgHash)}`);
  console.log('SERVER raw sig string from body:', senderSignature);
  console.log('SERVER raw sig string length:', senderSignature.length);
  console.log('SERVER sig bytes length:', senderSignatureToBytes.length); 

  const senderPublicKeyBytes = 
    secpNoble.recoverPublicKey(senderSignatureToBytes, msgHash, { prehash: false });
  const publicKeyPoint = secpNoble.Point.fromBytes(senderPublicKeyBytes);
  const publicKeyPointHex = publicKeyPoint.toHex(false); // --> this is the uncompressed public key
  const publicKeyPointHexIsCompressed = publicKeyPoint.toHex(true); // here's the compressed public key

  console.log(`(hex) public key uncompressed => ${publicKeyPointHex}`);
  console.log(`(hex) public key compressed => ${publicKeyPointHexIsCompressed}`);

  // phase 3 -- derive address from public key
  const senderPublicKey = publicKeyPointHex;
  const sender = '0x' + senderPublicKey.slice(-20);
  // phase 3 -- decrypt signature and validate encrypted hash -- verify signature
  // DECRYPTED(SIGNATURE) MUST BE SHA256(MSG)

  const sig64 = senderSignatureToBytes.slice(0, 64);
  console.log('=== VERIFY DIAGNOSTIC ===');
  console.log('sig64 length:', sig64.length, '(must be 64)');
  console.log('sig64 is Uint8Array:', sig64 instanceof Uint8Array);
  console.log('sig64 hex:', toHex(sig64));

  console.log('msgHash length:', msgHash.length, '(must be 32)');
  console.log('msgHash is Uint8Array:', msgHash instanceof Uint8Array);
  console.log('msgHash hex:', toHex(msgHash));

  console.log('pubKey length:', senderPublicKeyBytes.length);
  console.log('pubKey is Uint8Array:', senderPublicKeyBytes instanceof Uint8Array);
  console.log('pubKey hex:', toHex(senderPublicKeyBytes));

  // Try every combination of options
const tests = [
  { prehash: false },
  { prehash: false, lowS: false },
  { prehash: true },
  { prehash: true, lowS: false },
  {},
  { lowS: false },
];

for (const opts of tests) {
  try {
    const result_uncompressed = secpNoble.verify(sig64, msgHash, hexToBytes(publicKeyPointHex), opts);
    const result_compressed = secpNoble.verify(sig64, msgHash, senderPublicKeyBytes, opts);
    console.log('verify with', JSON.stringify(opts), '=>', result_uncompressed);
    console.log('verify with', JSON.stringify(opts), '=>', result_compressed);
  } catch (e) {
    console.log('verify with', JSON.stringify(opts), '=> ERROR:', e.message);
  }
}

  const isValid = secpNoble.verify(
    senderSignatureToBytes.slice(1, 65), 
    msgHash, 
    senderPublicKeyBytes, 
  { prehash: false, lowS: false });
  // phase 3 -- reject invalid signatures
  if (!isValid)
    return res.status(400).send({ message: 'Invalid signature!' });

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
