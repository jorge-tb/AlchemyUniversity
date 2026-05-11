import server from "./server";
import * as secp from 'ethereum-cryptography/secp256k1';
import { hexToBytes, toHex } from "ethereum-cryptography/utils";

function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onChange(evt) {
    const address = evt.target.value;
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  async function onPrivateKeyChange(evt) {
    const privateKey = evt.target.value;
    console.log(`pre-set ${privateKey}`);
    setPrivateKey(privateKey);
    console.log(`post-set ${privateKey}`);
    const publicKeyBytes = secp.getPublicKey(hexToBytes(privateKey));
    const address = '0x' + toHex(publicKeyBytes).slice(-20)
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Wallet Address
        <input placeholder="Type an address, for example: 0x1" value={address} onChange={onChange}></input>
      </label>

      <label>
        Wallet Private Key
        <input placeholder="Type a private key" value={privateKey} onChange={onPrivateKeyChange}></input>
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
