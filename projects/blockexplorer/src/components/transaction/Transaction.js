import { useState, useEffect } from 'react';
import { alchemy } from '../../AlchemyClient';
import './Transaction.css';

export function Transaction({ hash, onBack }) {
  const [tx, setTx] = useState();

  useEffect(() => {
    if (!hash) return;
    async function getTx() {
      setTx(await alchemy.core.getTransaction(hash));
    }
    getTx();
  }, [hash]);

  const formatBigNumber = (bn) => {
    if (bn == null) return 'N/A';
    try { return BigInt(bn.toString()).toString(); }
    catch { return 'N/A'; }
  };

  const weiToEth = (bn) => {
    if (bn == null) return 'N/A';
    try {
      const wei = BigInt(bn.toString());
      const eth = Number(wei) / 1e18;
      return `${eth} ETH (${wei.toString()} wei)`;
    } catch { return 'N/A'; }
  };

  if (!tx) {
    return (
      <div className="TransactionData">
        <button type="button" className="back-btn" onClick={onBack}>← Back to block</button>
        <div>Loading transaction {hash}...</div>
      </div>
    );
  }

  return (
    <div className="TransactionData">
      <button type="button" className="back-btn" onClick={onBack}>← Back to block</button>
      <h2>Transaction</h2>

      <table>
        <tbody>
          <tr><td>Hash</td><td>{tx.hash}</td></tr>
          <tr><td>Block Number</td><td>{tx.blockNumber}</td></tr>
          <tr><td>From</td><td>{tx.from}</td></tr>
          <tr><td>To</td><td>{tx.to ?? '(contract creation)'}</td></tr>
          <tr><td>Value</td><td>{weiToEth(tx.value)}</td></tr>
          <tr><td>Gas Limit</td><td>{formatBigNumber(tx.gasLimit)}</td></tr>
          <tr><td>Gas Price (wei)</td><td>{formatBigNumber(tx.gasPrice)}</td></tr>
          <tr><td>Nonce</td><td>{tx.nonce}</td></tr>
          <tr><td>Type</td><td>{tx.type}</td></tr>
          <tr><td>Chain ID</td><td>{tx.chainId}</td></tr>
          <tr><td>Input Data</td><td>{tx.data}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
