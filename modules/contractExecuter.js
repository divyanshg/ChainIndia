var process = require('process');

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

process.on('message', async (txn) => {
    const contract = requireUncached('../Contracts/' + txn.toAddress + '.js');
    console.log(await contract(txn))
})

/*
Contract{
    address: '0x0',
    abi: [{
        "constant": false,
        "inputs": [{
            "name": "data",
            "type": "string"
        }],
        "name": "setData",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "getData",
        "outputs": [{
            "name": "",
            "type": "string"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }],
}
*/