const SocketActions = require('./constants');

const Transaction = require('../models/transaction');
const Blockchain = require('../models/chain');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Your private key goes here
const myKey = ec.keyFromPrivate('1f9db327e16ca89d678e1b4d19705446bd88082a1a7375a9f6c08802634218a2');

// From that we can calculate your public key (which doubles as your wallet address)
const minerAddr = myKey.getPublic('hex');

const socketListeners = (socket, blockChain) => {
    socket.on(SocketActions.ADD_TRANSACTION, (sender, receiver, data) => {
        const transaction = new Transaction(sender, receiver, data);

        blockChain.addTransaction(transaction);
        console.info(`Added transaction`, transaction.hash);
    });

    socket.on(SocketActions.END_MINING, (newChain, miner) => {
        if(miner == minerAddr) return
        console.log('End Mining encountered');
        
        process.env.BREAK = "true";
        blockChain.miner.kill()

        const chainIndia = new Blockchain();

        chainIndia.parseChain(newChain.chain);

        if (chainIndia.isChainValid() && chainIndia.getLength() >= blockChain.getLength()) {
            blockChain.chain = chainIndia.chain;
            console.log(blockChain.chain)
            console.log("Network Balanced");
            process.env.BREAK = "false";
        }
    });

    socket.on("ADD_WALLET", (wallet) => {
        console.log(wallet)
    })

    return socket;
};

module.exports = socketListeners;