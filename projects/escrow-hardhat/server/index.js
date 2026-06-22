const { Network } = require('alchemy-sdk');
const alchemyClientFactory = require('./alchemy-client-factory.js');
const { EscrowService } = require('./escrow-service.js');
const { Contract } = require('./contract.js');
const express = require('express');
const app = express();

const { PORT } = process.env;

app.get('/contracts/:address', async (req, res) => {
    try {
        // Extract route param
        const deployer = req.params.address;
        // Create Sepolia Alchemy client
        const sepoliaClient = alchemyClientFactory(Network.ETH_SEPOLIA);
        // Create Escrow service
        const escrowService = new EscrowService(sepoliaClient);
        // Find Escrow contracts
        const escrows = await escrowService.find(deployer);
        // Return Escrow contracts
        return res.send(escrows);
    } catch (err) {
        console.error(`Failed to load contracts for ${req.params.address}:`, err);
        return res.status(502).send({ error: 'Failed to load contracts' });
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});