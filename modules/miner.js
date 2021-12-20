const Block = require('../models/block');

var process = require('process');

process.on('message', function ({block, difficulty}) {
    const newblock = new Block(block.timestamp, block.transactions, block.previousHash);
    newblock.mineBlock(difficulty);
    process.send(newblock)
});
