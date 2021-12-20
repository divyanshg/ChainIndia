const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const getCipherKey = require('./getCipherKey');

var encryptor = require('simple-encryptor')("c3d56504c14d6c236794cd15e26b98a53bcc0e84199e4ac0a51eb107326e0e8b");


function decrypt({
    file,
    password
}) {
    // First, get the initialization vector from the file.
    const readInitVect = fs.createReadStream(file, {
        end: 15
    });

    let initVect;
    readInitVect.on('data', (chunk) => {
        initVect = chunk;
    });

    // Once we’ve got the initialization vector, we can decrypt the file.
    readInitVect.on('close', () => {
        const cipherKey = getCipherKey(password);
        const readStream = fs.createReadStream(file, {
            start: 16
        });
        const decipher = crypto.createDecipheriv('aes256', cipherKey, initVect);
        const unzip = zlib.createUnzip();
        const writeStream = fs.createWriteStream(encryptor.decrypt(path.join(file)));

        readStream
            .pipe(decipher)
            .pipe(unzip)
            .pipe(writeStream);

    });
}

decrypt({
    file: './eab383be922f27ac5075de2208c817691d8afda3554d7c0ca613609d96baf8122e5acf03319550667c191b477a1d4602C+7Mw40sVPYX8+fGUZklAw==',
    password: 'c3d56504c14d6c236794cd15e26b98a53bcc0e84199e4ac0a51eb107326e0e8b'
});