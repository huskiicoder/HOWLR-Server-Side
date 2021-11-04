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


    // pool.query(theQuery, request.params.token)
    //         .then(result => {
    //             console.log('second')
    //             // There is a match, confirm the email address
    //             let verificationQuery = "UPDATE MEMBERS SET verification = 1 WHERE confirmCode = $1"
    //             pool.query(verificationQuery, request.params.token)
    //                 .then(result2 => {
    //                     console.log('third')
    //                     // delete the confirmation code for that user in the database
    //                     let deleteQuery = "UPDATE Members SET confirmCode = -1 WHERE confirmCode = $1"
    //                     pool.query(deleteQuery, request.params.token)
    //                         .then(result3 => {
    //                             // all done, email confirmed!
    //                             console.log('Email confirmed!')
    //                             response.status(201).send({
    //                                 success: true,
    //                             })
    //                         })
    //                 })
    //         })
//             .catch((error) => {
//                 //log the error
//                 // console.log(error)
//                 if (error.constraint == "members_username_key") {
//                     response.status(400).send({
//                         message: "Username exists"
//                     })
//                 } else if (error.constraint == "members_email_key") {
//                     response.status(400).send({
//                         message: "Email exists"
//                     })
//                 } else {
//                     console.log('register')
//                     response.status(400).send({
//                         message: "other error, see detail",
//                         detail: error.detail
//                     })
//                 }
//             })
// })

module.exports = router