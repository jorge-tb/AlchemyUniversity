import { useState, useEffect } from 'react';
import { alchemy } from '../../AlchemyClient';
import './Block.css';

export function Block({ number }) {
  const [blockData, setBlockData] = useState();

  useEffect(() => {
    if (number === undefined) return;
    async function getBlock() {
      setBlockData(await alchemy.core.getBlock(number));
    }
    getBlock();
  }, [number]);

  if (!blockData) return <div>Loading block {number}...</div>;

  const formatBigNumber = (bn) => {
    if (bn == null) return 'N/A';
    try { return BigInt(bn.toString()).toString(); }
    catch { return 'N/A'; }
  };

  // Helper: timestamp is a Unix epoch in seconds
  const formatTimestamp = (ts) => {
    const date = new Date(ts * 1000);
    return `${date.toLocaleString()} (${ts})`;
  };

  // Helper: shorten long hashes for display
  const shorten = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  // Helper: decode the hex extraData into UTF-8 if possible (builders often
  // embed a signature like "Titan (titanbuilder.xyz)")
  const decodeExtraData = (hex) => {
    if (!hex || !hex.startsWith('0x')) return hex;
    try {
      const bytes = hex.slice(2).match(/.{1,2}/g).map(b => parseInt(b, 16));
      const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      // Only show decoded text if it looks printable
      const printable = text.replace(/[^\x20-\x7E]/g, '');
      return printable.length > 3 ? `${hex} ("${printable}")` : hex;
    } catch {
      return hex;
    }
  };

  return (
    <div className="BlockData">
      <h2>Block #{blockData.number}</h2>

      <table>
        <tbody>
          <tr>
            <td>Hash</td>
            <td title={blockData.hash}>{shorten(blockData.hash)}</td>
          </tr>
          <tr>
            <td>Parent Hash</td>
            <td title={blockData.parentHash}>{shorten(blockData.parentHash)}</td>
          </tr>
          <tr>
            <td>Number</td>
            <td>{blockData.number}</td>
          </tr>
          <tr>
            <td>Timestamp</td>
            <td>{formatTimestamp(blockData.timestamp)}</td>
          </tr>
          <tr>
            <td>Nonce</td>
            <td>{blockData.nonce}</td>
          </tr>
          <tr>
            <td>Difficulty</td>
            <td>{blockData.difficulty}</td>
          </tr>
          <tr>
            <td>Gas Limit</td>
            <td>{formatBigNumber(blockData.gasLimit)}</td>
          </tr>
          <tr>
            <td>Gas Used</td>
            <td>{formatBigNumber(blockData.gasUsed)}</td>
          </tr>
          <tr>
            <td>Miner</td>
            <td title={blockData.miner}>{blockData.miner}</td>
          </tr>
          <tr>
            <td>Extra Data</td>
            <td>{decodeExtraData(blockData.extraData)}</td>
          </tr>
          <tr>
            <td>Base Fee Per Gas (wei)</td>
            <td>{formatBigNumber(blockData.baseFeePerGas)}</td>
          </tr>
          <tr>
            <td>Transaction Count</td>
            <td>{blockData.transactions?.length ?? 0}</td>
          </tr>
        </tbody>
      </table>

      <details>
        <summary>
          Transactions ({blockData.transactions?.length ?? 0})
        </summary>
        <ul className="tx-list">
          {blockData.transactions?.map((tx) => (
            <li key={tx} title={tx}>{shorten(tx)}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}