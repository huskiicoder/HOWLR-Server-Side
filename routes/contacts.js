//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {post} /contacts Request to add someone's member id to the DB
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiParam {String} member id A
 * @apiParam {String} member id B
 * 
 * @apiSuccess (Success 201) {boolean} success true when the member id is inserted
 * @apiSuccess (Success 201) {String} message the inserted member id
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
 router.post("/", (request, response) => {

    if (isStringProvided(request.body.memberIdA) 
    && isStringProvided(request.body.memberIdB)) {
        const theQuery = "INSERT INTO CONTACTS(MemberID_A, MemberID_B) VALUES ($1, $2) RETURNING *"
        const values = [request.body.memberIdA, request.body.memberIdB]

        pool.query(theQuery, values)
            .then(result => {
                response.status(201).send({
                    success: true,
                    message: "Inserted: " + result.rows[0].name
                })
            })
            .catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                })    
            }) 
            
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }    
})

module.exports = router