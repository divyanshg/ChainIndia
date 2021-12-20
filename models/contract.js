const generateNonce = require("../modules/generateNonce")
const rlp = require('rlp');
const keccak = require('keccak');

class Contract{
    constructor(sender){
        this.sender = sender
        this.nonce = generateNonce()
        this.byteCode = generateNonce()
        this.type = 'contract'
        this.address = "0xCTCx"+keccak('keccak256').update(rlp.encode([this.sender, this.nonce, this.byteCode, this.type])).digest('hex')
    }
}

module.exports = Contract