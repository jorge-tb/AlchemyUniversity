import { ethers } from 'ethers';

// Wallet/signer. Only when MetaMask is injected.
export function getBrowserProvider() {
    if (!window.ethereum) throw new Error('MetaMask not detected');
    return new ethers.BrowserProvider(window.ethereum);
}