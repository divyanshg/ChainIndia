const Block = require('./block');
const Transaction = require('./transaction');
const Wallet = require('./wallet');
const Contract = require('./contract');

const debug = require('debug')('chainIndia:blockchain');
const actions = require('../modules/constants');

var cp = require('child_process');
const EC = require('elliptic').ec;
// You can use any elliptic curve you want
const ec = new EC('secp256k1');
const myKey = ec.keyFromPrivate(process.env.PRIVATE_KEY);

// From that we can calculate your public key (which doubles as your wallet address)
const minerAddr = myKey.getPublic('hex');

const Blocks = require('../database/schema/Blocks');


class BlockChain {
    constructor(chain, io) {
        this.chain =  [this.createGenesisBlock()]; //chain && chain.length !=0 ? chain :
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.io = io
        this.nodes = []
        this.miner = '';
    }

    /**
     * @returns {Block}
     */
    createGenesisBlock() {
        const genesisBlock = new Block(Date.parse('2017-01-01'), [], '0');
        const genesis = new Blocks(genesisBlock);
        genesis.save();
        return genesisBlock;
    }

    /**
     * Adds a new node to the list of nodes.
     * @param {string} node
     */
    addNode(node) {
        this.nodes.push(node);
    }

    /**
     * Returns the latest block on our chain. Useful when you want to create a
     * new Block and you need the hash of the previous Block.
     *
     * @returns {Block[]}
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Takes all the pending transactions, puts them in a Block and starts the
     * mining process. It also adds a transaction to send the mining reward to
     * the given address.
     *
     * @param {string} miningRewardAddress
     */
    async minePendingTransactions() {
        // const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        // this.pendingTransactions.push(rewardTx);=
            // const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        const block = {
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            previousHash: this.getLatestBlock().hash
        }

        console.log("Mining block");
        //const minedBlock = await startMiner(block, this.difficulty);
        this.miner = cp.fork('./modules/miner.js');

        this.miner.send({block, difficulty:this.difficulty})

        var thisChain = this

        this.miner.on('message', function(block) {
            console.log('Block successfully mined!');
            // thisChain.chain.push(block);

            const newBlock = new Blocks(block);
            newBlock.save();
            // console.log(block)

            var tmpio = thisChain.io
            var tmpnode = thisChain.nodes

            thisChain.io = undefined
            thisChain.nodes = undefined

            let unVerifiedBlock = {
                timestamp: block.timestamp,
                transactions: block.transactions,
                previousHash: block.previousHash,
                nonce: block.nonce,
                miner: block.miner,
                merkleRoot: block.merkleRoot,
            }

            tmpio.emit(actions.END_MINING, unVerifiedBlock, minerAddr);

            thisChain.io = tmpio
            thisChain.nodes = tmpnode

            thisChain.pendingTransactions = [];
            thisChain.miner.kill()
        })

        this.miner.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        this.pendingTransactions = []

    }

    /**
     * Add a new transaction to the list of pending transactions (to be added
     * next time the mining process starts). This verifies that the given
     * transaction is properly signed.
     *
     * @param {Transaction} transaction
     */
    async addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        // // Verify the transactiion
        // if (!transaction.isValid()) {
        //     throw new Error('Cannot add invalid transaction to chain');
        // }

        if(transaction.toAddress.substring(0,6) == '0xCTCx'){
            console.log('CTC transaction')
            //check if contract exists on chain
            await this.isContractAvailable(transaction.toAddress)
                .then(result => {
                    if(!result) return
                    const executer = cp.fork('./modules/contractExecuter.js');
                    executer.send(transaction)
                })
        }

        if (!transaction.data) {
            throw new Error('Transaction amount should be higher than 0');
        }

        // Making sure that the amount sent is not greater than existing balance
        // if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
        //     throw new Error('Not enough balance');
        // }

        await this.pendingTransactions.push(transaction);
        if(this.pendingTransactions.length >= 3) {
            this.minePendingTransactions();
        }
    }

    /**
     * To add a new chain to existing chain
     */

    parseChain(blocks) {
        this.chain = blocks.map(block => {
            const parsedBlock = new Block();
            parsedBlock.parseBlock(block);
            return parsedBlock;
        });
    }

    createContract(sender){
        const ctc = new Contract(sender)

        const txn = new Transaction(sender, minerAddr, ctc);
        this.addTransaction(txn)
        console.log(txn)

        return ctc.address;
    }

    createWallet(secret) {
        const key = ec.genKeyPair();
        const wallet = new Wallet(key, secret);

        this.io.emit('ADD_WALLET', wallet)

        return wallet.getAddress()
    }

    createFile(){
        
    }

    isContractAvailable(address){
        return new Promise((resolve, reject) => {
            try{
                for(const block of this.chain){
                    for(const txns of block.transaction){
                        if(txns.data.type == 'contract' && txns.data.address == address){
                            resolve(true)
                        }
                    }
                }
                resolve(false)
            }catch(e){
                reject(false)
            }
        })
    }


    /**
     * Returns the data of a given wallet address.
     *
     * @param {string} address
     * @returns {array} The data of the wallet
     */
    getDataOfAddress(address) {
        var data = []
        for (const block of this.chain) {
            for (const txns of block.transactions) {
                //if(txns.data.type && txns.data.type == 'wallet') return
                if (txns.fromAddress === address) {
                    data.push(txns.data)
                }

                if (txns.toAddress === address) {
                    data.push(txns.data)
                }
            }
        }
        return data;
    }

    /**
     * Returns a list of all transactions that happened
     * to and from the given wallet address.
     *
     * @param  {string} address
     * @return {Transaction[]}
     */
    getAllTransactionsForWallet(address) {
        const txs = [];

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address || tx.toAddress === address) {
                    txs.push(tx);
                }
            }
        }

        debug('get transactions for wallet count: %s', txs.length);
        return txs;
    }

    /**
     * Loops over all the blocks in the chain and verify if they are properly
     * linked together and nobody has tampered with the hashes. By checking
     * the blocks it also verifies the (signed) transactions inside of them.
     *
     * @returns {boolean}
     */
    isChainValid() {
        // Check if the Genesis block hasn't been tampered with by comparing
        // the output of createGenesisBlock with the first block on our chain
        const realGenesis = JSON.stringify(this.createGenesisBlock());

        if (realGenesis !== JSON.stringify(this.chain[0])) {
            return false;
        }

        // Check the remaining blocks on the chain to see if there hashes and
        // signatures are correct
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (previousBlock.hash !== currentBlock.previousHash) {
                return false;
            }

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Returns the length of the chain.
     * @returns {number}
     */
    getLength() {
        return this.chain.length;
    }
}

module.exports = BlockChain;