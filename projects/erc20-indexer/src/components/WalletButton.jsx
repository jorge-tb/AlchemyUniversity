import { useWallet } from "../useWallet";

export function WalletButton() {
  const { account, chainId, connect } = useWallet();
  if (account) {
    return <span>{account.slice(0, 6)}…{account.slice(-4)} · chain {chainId}</span>;
  }
  return <button onClick={connect}>Connect MetaMask</button>;
}