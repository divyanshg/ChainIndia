const SHA256 = require('crypto-js/sha256');
const generateNonce = require('../modules/generateNonce');
const debug = require('debug')('chainIndia:blockchain');
const Transaction = require('./transaction');
const {
    MerkleTree
} = require('merkletreejs')

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Your private key goes here
const myKey = ec.keyFromPrivate(process.env.PRIVATE_KEY);

// From that we can calculate your public key (which doubles as your wallet address)
const minerAddress = myKey.getPublic('hex');

function calculateMerkleRoot(transactions) {
    if(!transactions) return null;
    const leaves = transactions.map(txn => SHA256(txn));
    const tree = new MerkleTree(leaves, SHA256);
    const root = tree.getRoot().toString('hex');
    return root;
}

class Block {
    /**
     * @param {number} timestamp
     * @param {Transaction[]} transactions
     * @param {string} previousHash
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.version = process.env.VERSION;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.merkleRoot = this.transactions ? calculateMerkleRoot(this.transactions) : '';
        this.confirmations = 0;
        this.miner = minerAddress;
        this.numberOfTransactions = this.transactions ? this.transactions.length : 0;
        this.size = new TextEncoder().encode(JSON.stringify(this)).length /1024
        this.hash = this.calculateHash();
    }

    /**
     * Returns the SHA256 of this block (by processing all the data stored
     * inside this block)
     *
     * @returns {string}
     */
    calculateHash() {
        return SHA256(this.version + this.previousHash + this.timestamp + this.merkleRoot + this.numberOfTransactions + this.size + this.nonce).toString();
    }

    /**
     * Starts the mining process on the block. It changes the 'nonce' until the hash
     * of the block starts with enough zeros (= difficulty)
     *
     * @param {number} difficulty
     */
    mineBlock(difficulty) {
        if(process.env.BREAK == 'false'){
            while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0') && process.env.BREAK == 'false') {
                if(process.env.BREAK == "true") {
                    console.log('stopping miner');
                    break
                }
                this.nonce = generateNonce();
                this.hash = this.calculateHash();
                console.log(this.nonce, this.hash);
            }
            console.log(`Block mined: ${this.hash}`);
        }
        return
    }

    parseBlock(block) {
        console.log(block)
        this.hash = block.hash;
        this.previousHash = block.previousHash;
        this.timestamp = block.timestamp;
        this.transactions = block.transactions.map(transaction => {
            return new Transaction(transaction.fromAddress, transaction.toAddress, transaction.data, transaction.timestamp);
        });
        this.nonce = block.nonce;
        this.merkleRoot = block.merkleRoot;
        this.confirmations = block.confirmations;
        this.miner = block.miner;
        this.numberOfTransactions = block.numberOfTransactions;
        this.size = block.size;
    }

    /**
     * Validates all the transactions inside this block (signature + hash) and
     * returns true if everything checks out. False if the block is invalid.
     *
     * @returns {boolean}
     */
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}

module.exports = Block;