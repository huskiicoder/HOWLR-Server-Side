//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool
var url = require('url')

const router = express.Router()

/**
 * @api {get} /confirm?token Verify an email address for use
 * @apiName GetConfirm
 * @apiGroup Confirm
 * 
 * @apiParam {String} token Token used to verify a user's email 
 * 
 * @apiSuccess {boolean} success true when the name is found and the confirm token matches
 * @apiSuccess {String} message "Success!""
 * 
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * 
 */ 
router.get('/', (request, response) => {
    // Make sure the account exists
    token = [request.query.token]
    let theQuery = "SELECT * FROM Members WHERE confirmCode = $1"
    pool.query(theQuery, token).then(result => {
        // verify the account and make it usable
        let verificationQuery = "UPDATE MEMBERS SET verification = 1 WHERE confirmCode = $1"
        pool.query(verificationQuery, token)
            .then(result => {
                var html =
                `<head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="https://bootswatch.com/4/litera/bootstrap.min.css">
                 </head>
                 <style>
                    body {background-image: url('https://cdn.discordapp.com/attachments/369671073240711168/909967066063331368/howlrBG1080.png');
                                          background-repeat: no-repeat;
                                          background-attachment: fixed;
                                          background-size: cover;}
                 </style>
                <p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://cdn.discordapp.com/attachments/369671073240711168/909963950509150228/howlrLogo.png" width="307" height="309" /></p>
                <h1 style="text-align: center;">Thank you for verifying your email!</h1>
                <div class="col-md-12 text-center">
                    <a href="http://howlr-server-side.herokuapp.com"><button type="button" class="btn btn-primary btn-lg">Continue to HOWLR</button></a>
                </div>
                </body>`
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.write(html);
                response.end();
            }).catch(e => console.log('error', e))
    }).catch((e) => console.log("error", e))
})

module.exports = router