import { useState } from "react";
import server from "./server";
import { sign, hashes } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { utf8ToBytes, hexToBytes, toHex } from 'ethereum-cryptography/utils';

hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
hashes.sha256 = sha256;

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    try {
    // phase 3
    const msg = { recipient, amount: parseInt(sendAmount) };
    const msgBytes = utf8ToBytes(JSON.stringify(msg));
    const msgHash = sha256(msgBytes);
    const senderPrivateKey = address;
    const senderPrivateKeyBytes = hexToBytes(senderPrivateKey);
    const senderSignature = sign(msgHash, senderPrivateKeyBytes, { format: 'recovered', prehash: false });

    const {
      data: { balance }
    } = await server.post(`send`, {
      sender: toHex(senderSignature),
      ...msg
    });

    setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
