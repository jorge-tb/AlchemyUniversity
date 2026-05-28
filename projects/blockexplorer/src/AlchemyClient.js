import { Alchemy, Network } from "alchemy-sdk";

// Refer to the README doc for more information about using API
// keys in client-side code. You should never do this in production
// level code.
const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const NETWORK_LABELS = {
  [Network.ETH_MAINNET]: 'Ethereum Mainnet',
  [Network.ETH_SEPOLIA]: 'Ethereum Sepolia',
  [Network.ETH_HOLESKY]: 'Ethereum Holesky',
};

export const networkLabel = NETWORK_LABELS[settings.network] ?? settings.network;

// In this week's lessons we used ethers.js. Here we are using the
// Alchemy SDK is an umbrella library with several different packages.
//
// You can read more about the packages here:
//   https://docs.alchemy.com/reference/alchemy-sdk-api-surface-overview#api-surface
export const alchemy = new Alchemy(settings);