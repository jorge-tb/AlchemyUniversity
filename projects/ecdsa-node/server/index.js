const secp = require('ethereum-cryptography/secp256k1');
const secpNoble = require('@noble/secp256k1');
const { hexToBytes, toHex, utf8ToBytes } = require('ethereum-cryptography/utils');
const { sha256 } = require('ethereum-cryptography/sha256');
const { Account } = require('./account.js');
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const FIVE_MINUTES = 5 * 60 * 1000;

// data structure: <public_key, nonces_map>
const NONCES_MEM = new Map(); // TODO: remove nonces older than the temporal window

app.use(cors());
app.use(express.json());

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

  // recreate msg
  const msg = { recipient, amount, timestamp, nonce };

  // apply timestamp guard
  if (isOutdated(msg))
    return res.status(400).send({ message: 'Timestamp out of window' });

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
  
  // apply reply guard
  if (isDuplicated(senderPublicKey, msg))
    return res.status(400).send({ message: 'Replay detected' });
  registerNonce(senderPublicKey, msg);

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

function isDuplicated(publicKey, msg) {
  return NONCES_MEM.has(publicKey) && NONCES_MEM.get(publicKey).has(msg.nonce)
}

function registerNonce(publicKey, msg) {
  if (NONCES_MEM.has(publicKey))
    NONCES_MEM.get(publicKey).set(msg.nonce, msg.timestamp);
  else
    NONCES_MEM.set(publicKey, new Map([[msg.nonce, msg.timestamp]]));
}

function isOutdated(msg) {
  return (Math.abs(Date.now() - msg.timestamp) > FIVE_MINUTES) 
}

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
