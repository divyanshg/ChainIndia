const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
    version: String,
    previousHash: String,
    timestamp: Number,
    transactions: [{
        fromAddress: String,
        toAddress: String,
        data: Object,
        timestamp: Number
    }],
    nonce: String,
    merkleRoot: String,
    confirmations: Number,
    miner: String,
    numberOfTransactions: Number,
    size: Number,
    hash: String
})

const Block = mongoose.model("Blocks", blockSchema);
module.exports = Block;