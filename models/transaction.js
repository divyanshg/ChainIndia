const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const debug = require('debug')('chainIndia:blockchain');
class Transaction {
    /**
     * @param {string} fromAddress
     * @param {string} toAddress
     * @param {any} data
     */
    constructor(fromAddress, toAddress, data, timestamp) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.data = data;
        this.timestamp = timestamp || Date.now();
        this.hash = this.calculateHash()
    }

    /**
     * Creates a SHA256 hash of the transaction
     *
     * @returns {string}
     */
    calculateHash() {
        return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + JSON.stringify(this.data) + this.timestamp).digest('hex');
    }

    parseTransaction(transaction) {
        this.fromAddress = transaction.fromAddress;
        this.toAddress = transaction.toAddress;
        this.data = transaction.data;
        this.timestamp = transaction.timestamp;
        this.hash = this.calculateHash()
    }

    isValid() {
        if(this.hash == this.calculateHash()) {
            return true;
        }
        return false
    }
}

module.exports = Transaction;