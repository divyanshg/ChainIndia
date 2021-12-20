const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const getCipherKey = require('./getCipherKey');
const AppendInitVect = require('./appendIV');
const genHMAC = require('./genHMAC');

var encryptor = require('simple-encryptor')("c3d56504c14d6c236794cd15e26b98a53bcc0e84199e4ac0a51eb107326e0e8b");

async function encrypt({
    file,
    password
}) {
    // Generate a secure, pseudo random initialization vector.
    const initVect = crypto.randomBytes(16);
    const HMAC = await genHMAC(file, password);

    // Generate a cipher key from the password.
    const CIPHER_KEY = getCipherKey(password);
    const readStream = fs.createReadStream(file);

    const gzip = zlib.createGzip();

    const cipher = crypto.createCipheriv('aes256', CIPHER_KEY, initVect);
    const appendInitVect = new AppendInitVect(initVect);

    // Create a write stream with a different file extension.
    const writeStream = fs.createWriteStream(encryptor.encrypt(path.join(file)));

    readStream
        .pipe(gzip)
        .pipe(cipher)
        .pipe(appendInitVect)
        .pipe(writeStream);

    fs.unlinkSync(file);
    console.log(HMAC)
}

encrypt({
    file: './app.js',
    password: 'c3d56504c14d6c236794cd15e26b98a53bcc0e84199e4ac0a51eb107326e0e8b'
})