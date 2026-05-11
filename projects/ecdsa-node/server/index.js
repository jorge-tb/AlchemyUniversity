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
  const { signature, recipient, amount, timestamp, nonce } = req.body;

  // recreate msg and hash it
  const msg = { recipient, amount, timestamp, nonce };
  const msgBytes = utf8ToBytes(JSON.stringify(msg));
  const msgHash = sha256(msgBytes);

  // obtain public key from recoverable digital signature
  // note: public key is compressed
  const senderSignatureToBytes = hexToBytes(signature);
  const senderPublicKeyBytes = 
    secpNoble.recoverPublicKey(senderSignatureToBytes, msgHash, { prehash: false });

  // obtain curve point through public key and decompres it 
  const publicKeyPoint = secpNoble.Point.fromBytes(senderPublicKeyBytes);
  const senderPublicKey = publicKeyPoint.toHex(false);

  // derive address from public key
  const sender = '0x' + senderPublicKey.slice(-20);

  // verify signature
  const isValid = secpNoble.verify(
    senderSignatureToBytes.slice(1, 65), 
    msgHash, 
    senderPublicKeyBytes, 
  { prehash: false, lowS: false });

  // reject invalid signatures
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
