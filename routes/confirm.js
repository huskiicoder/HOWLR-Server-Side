//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool
var url = require('url')

const router = express.Router()

router.get('/', (request, response) => {
    // Make sure the account exists
    token = [request.query.token]
    let theQuery = "SELECT * FROM Members WHERE confirmCode = $1"
    pool.query(theQuery, token).then(result => {
        // verify the account and make it usable
        let verificationQuery = "UPDATE MEMBERS SET verification = 1 WHERE confirmCode = $1"
        pool.query(verificationQuery, token)
            .then(result => {
                response.status(201).send ({
                    status: 'success'
                })
            }).catch(e => console.log('error', e))
    }).catch((e) => console.log("error", e))
})

module.exports = router