require('dotenv').config()
const express = require('express')
const app = express();
const httpServer = require('http').Server(app);
const axios = require('axios');
const io = require('socket.io')(httpServer);
const client = require('socket.io-client');

const BlockChain = require('./models/chain');
const SocketActions = require('./modules/constants');

const socketListeners = require('./modules/socketListeners');

const PORT = 3000
process.env.BREAK = "false";

const db = require('./database/db')();
const Blocks = require('./database/schema/Blocks');

let chainIndia;

Blocks.find({}, (err, blocks) => {
    if (err) throw err;
    chainIndia = new BlockChain(blocks, io);

    app.use(express.json());

    app.post('/nodes', (req, res) => {
        const {
            host,
            port
        } = req.body;
        const {
            callback
        } = req.query;

        const node = `http://${host}:${port}`;
        const socketNode = socketListeners(client(node), chainIndia);

        chainIndia.addNode(socketNode);

        if (callback === 'true') {
            console.info(`Added node ${node} back`);
            res.json({
                status: 'Added node Back'
            }).end();
        } else {
            axios.post(`${node}/nodes?callback=true`, {
                host: req.hostname,
                port: PORT,
            });
            console.info(`Added node ${node}`);
            res.json({
                status: 'Added node'
            }).end();
        }
    });

    app.post('/transaction', (req, res) => {
        const {
            from: fromAddress,
            to: toAddress,
            data
        } = req.body;

        io.emit(SocketActions.ADD_TRANSACTION, fromAddress, toAddress, data);

        res.json({
            message: 'transaction success'
        }).end();
    });

    app.get('/chain', (req, res) => {
        chain = chainIndia.chain;
        res.json(chain).end();
    });

    app.post('/newWallet', (req, res) => {
        const {
            secret
        } = req.body
        const address = chainIndia.createWallet(secret)
        res.send(`This is your new Wallet Address : ${address}`)
    })

    app.post('/contract', (req, res) => {
        const {
            sender
        } = req.body
        const address = chainIndia.createContract(sender)
        res.send(`This is your Contract Address : ${address}`)
    })

    app.route('/file')
        .post((req, res) => {

        })
        .get((req, res) => {

        })

    app.get('/data', (req, res) => {
        const {
            address
        } = req.query
        const data = chainIndia.getDataOfAddress(address)
        res.json(data)
    })

    io.on('connection', (socket) => {
        console.info(`Socket connected, ID: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Socket disconnected, ID: ${socket.id}`);
        });
    });

    chainIndia.addNode(socketListeners(client(`http://localhost:${PORT}`), chainIndia));
    chainIndia.addNode(socketListeners(client(`http://ip-10-1-1-154:${PORT}`), chainIndia));

})
httpServer.listen(PORT, () => console.info(`Express server running on ${PORT}...`));