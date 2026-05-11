const secp = require('ethereum-cryptography/secp256k1');
const { toHex } = require('ethereum-cryptography/utils');

class Account {
    constructor(funds=0) {
        this.privateKey = secp.utils.randomPrivateKey();
        this.publicKey = secp.getPublicKey(this.privateKey);
        this.address = '0x' + this.getPublicKeyHex().slice(-20);
        this.funds = funds;
    }

    getPublicKeyHex() {
        return toHex(this.publicKey);
    }

    getPrivateKeyHex() {
        return toHex(this.privateKey);
    }

    toString() {
        return `
        privateKey: ${this.getPrivateKeyHex()}\n
        publicKey: ${this.getPublicKeyHex()}\n
        address: ${this.address}\n`
    }
}

module.exports.Account = Account;