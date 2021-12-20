var crypto = require('crypto');
var fs = require('fs');

//Algorithm to be used for HMAC
var algorithm = 'md5';

module.exports = (file, password) => {
    return new Promise((resolve, reject) => {
        try{
            var hmac = crypto.createHmac(algorithm, password);
            var file_data = fs.ReadStream(file);
            file_data.on('data', function (data) {
                hmac.update(data)
            })
            file_data.on('end', function () {
                var gen_hmac = hmac.digest('hex')
                resolve(gen_hmac)
            })
        }catch(err){
            reject(err);
        }
    })
}