import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getBrowserProvider } from "./providers/browser.js";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [signer, setSigner] = useState(null);

  const sync = useCallback(async (accounts) => {
    if (!accounts?.length) {
      setAccount(null);
      setSigner(null);
      return;
    }
    const provider = getBrowserProvider();
    const network = await provider.getNetwork();
    setAccount(accounts[0]);
    setChainId(Number(network.chainId));
    setSigner(await provider.getSigner());
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    // Prompts MetaMask
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    await sync(accounts);
  }, [sync]);

  useEffect(() => {
    if (!window.ethereum) return;

    // Reconnect silently if already authorized (no popup)
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(sync)
      .catch(console.error);

    const onAccounts = (accounts) => sync(accounts);
    const onChain = () => window.location.reload(); // MetaMask's recommended pattern

    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [sync]);

  return { account, chainId, signer, connect };
}