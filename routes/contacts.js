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
    if (!isStringProvided(request.body.memberIdA) && !isStringProvided(request.body.memberIdA)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate memberid A exists in the chat
    let query = 'SELECT * FROM Members WHERE MemberId=$1'
    let values = [request.decoded.memberIdA]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                next()
            } else {
                response.status(400).send({
                    message: "user A not in member"
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on member in chat check",
                error: error
            })
}), (request, response, next) => {
    //validate memberid B exists in the chat
    let query = 'SELECT * FROM Members WHERE MemberId=$1'
    let values = [request.decoded.memberIdB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                next()
            } else {
                response.status(400).send({
                    message: "user B not in member"
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on member in chat check",
                error: error
}), (request, response) => {
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

/**
 * @api {get} /contacts/:primaryKey? Request to get the contact in a contact list
 * @apiName GetContacts
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} primaryKey the contact to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the a contact list
 * 
 * @apiError (404: ChatId Not Found) {String} message "Primary Key Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. primaryKey must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
 router.get("/:primaryKey", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.params.primaryKey) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.primaryKey)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
},  (request, response) => {
    //validate contact id exists
    let query = 'SELECT * FROM CONTACTS WHERE PrimaryKey=$1'
    let values = [request.params.primaryKey]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact ID not found"
                })
            } else {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

/**
 * @api {delete} /contacts/:primaryKey?/ Request delete a contact from a contact list
 * @apiName DeleteCcontact
 * @apiGroup Contacts
 * 
 * @apiDescription Does not delete the memberid associated with the required JWT but 
 * instead deletes the contact based on the primary key.  
 * 
 * @apiParam {Number} primaryKey the contact id to delete the contact from a contact list
 * 
 * @apiSuccess {boolean} success true when the contact is deleted
 * 
 * @apiError (404: Chat Not Found) {String} message "primaryKey not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. primaryKey must be a number" 
 * @apiError (400: Duplicate Email) {String} message "contact not in contact list"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.delete("/:primaryKey", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.primaryKey) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.primaryKey)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CONTACTS WHERE PrimaryKey=$1'
    let values = [request.params.primaryKey]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    //Delete the primaryKey from the contacts
    let insert = `DELETE FROM CONTACTS
                  WHERE PrimaryKey=$1
                  RETURNING *`
    let values = [request.params.primaryKey]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
    }
)

module.exports = router