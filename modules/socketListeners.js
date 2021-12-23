const SocketActions = require('./constants');

const Transaction = require('../models/transaction');
const Block = require('../models/block');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');


// Your private key goes here
const myKey = ec.keyFromPrivate(process.env.PRIVATE_KEY);

// From that we can calculate your public key (which doubles as your wallet address)
const minerAddr = myKey.getPublic('hex');

const socketListeners = (socket, blockChain) => {
    socket.on(SocketActions.ADD_TRANSACTION, (sender, receiver, data) => {
        const transaction = new Transaction(sender, receiver, data);

        blockChain.addTransaction(transaction);
        console.info(`Added transaction`, transaction.hash);
    });

    socket.on(SocketActions.END_MINING, (unverifiedBlock, miner) => {
        if(miner == minerAddr) return
        console.log('End Mining encountered');
        
        process.env.BREAK = "true";
        blockChain.miner.kill()

        const block = new Block(unverifiedBlock.timestamp, unverifiedBlock.transactions, unverifiedBlock.previousHash);
        block.nonce = unverifiedBlock.nonce;
        block.miner = unverifiedBlock.miner;
        console.log(SHA256(block.version + unverifiedBlock.previousHash + unverifiedBlock.timestamp + block.merkleRoot + block.numberOfTransactions + block.size + unverifiedBlock.nonce).toString())
        // console.log(block.verifyBlock(4), block.hash, block.nonce);

        // const chainIndia = new Blockchain();

        // chainIndia.parseChain(unverifiedBlock.chain);

        // if (chainIndia.isChainValid() && chainIndia.getLength() >= blockChain.getLength()) {
        //     blockChain.chain = chainIndia.chain;
        //     console.log(blockChain.chain)
        //     console.log("Network Balanced");
        //     process.env.BREAK = "false";
        // }
    });

    socket.on("ADD_WALLET", (wallet) => {
        const txn = new Transaction(minerAddr, wallet.address, wallet);
        blockChain.addTransaction(txn);
        console.log(txn)
    })

    return socket;
};

module.exports = socketListeners;