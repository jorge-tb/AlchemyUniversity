const { Alchemy, Network } = require('alchemy-sdk');

const { ALCHEMY_API_KEY } = process.env;

/**
 * Create an Alchemy RPC client.
 * @param {Network} network - The network to be connected to.
 * @returns 
 */
const alchemyClientFactory = (network) => new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network
});

module.exports = alchemyClientFactory;