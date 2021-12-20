const rlp = require('rlp');
const keccak = require('keccak');
const bcrypt = require('bcryptjs');

class Wallet {
    constructor(key, secret) {
        this.privateKey = key.getPrivate('hex')
        this.publicKey = key.getPublic('hex')
        this.secret = bcrypt.hashSync(secret, 10)
        this.address = "0x"+keccak('keccak256').update(rlp.encode([this.privateKey, this.secret])).digest('hex').toString().substring(0, 40)
        this.type = "wallet"
    }

    getAddress() {
        return this.address
    }
}

module.exports = Wallet;