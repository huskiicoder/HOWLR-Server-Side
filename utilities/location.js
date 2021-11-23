// https://stackoverflow.com/questions/49634012/return-result-of-https-get-in-js

const https = require('https')

let getPostalUrl= (url, cb) => {
    https.get(url, (resp) => {
        let data = ''

        let value = ''

        resp.on('data', chunk => data += chunk);

        resp.on('end', () => {
        value = JSON.parse(data)

        // cb(null, value.postal);
        cb(null, value.loc);
        });
    }).on('error', (err) => {
        cb(err);
    });
}

module.exports = { 
    getPostalUrl
}