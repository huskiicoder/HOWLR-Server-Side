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
 * @api {post} /contacts Request to add a new contact to the DB
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiParam {String} username A
 * @apiParam {String} username B
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
 router.post("/", (request, response, next) => {
    if (!isStringProvided(request.body.usernameA) && !isStringProvided(request.body.usernameB)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM MEMBERS WHERE Email=$1'
    let values = [request.params.usernameA]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.usernameA = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
},(request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM MEMBERS WHERE Email=$1'
    let values = [request.params.usernameB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.usernameB = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    const theQuery = `INSERT INTO CONTACTS(MemberID_A, MemberID_B) VALUES($1,$2) RETURN ContactID`
    const values = [request.body.usernameA, request.body.usernameB]

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
})


/**
 * @api {get} /contacts/:email Request to get the contact in a contact list
 * @apiName GetContacts
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} email the contact to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the a contact list
 * 
 * @apiError (404: Contact Id Not Found) {String} message "Email Not Found"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 

router.get("/:email", (request, response, next) => {
    if (!request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
},  (request, response, next) => {
    //validate email exists
    let query = 'SELECT * FROM MEMBERS WHERE Email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Email not found"
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
        //Retrieve the members
        let query = `SELECT Members.MemberID, Members.Username, Members.Lastname, Members.Firstname 
                    FROM Members
                    INNER JOIN Contacts ON Members.MemberId=Contacts.MemberId_B
                    WHERE Contacts.MemberId_A=(Select MemberID from Members where email=$1) 
                    and Verified=1`
        let values = [request.params.email]
        pool.query(query, values)
            .then(result => {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                })
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                })
            })
});

/**
 * @api {delete} /contacts/:username/:memberid Request delete a contact from a contact list
 * @apiName DeleteCcontact
 * @apiGroup Contacts
 * 
 * @apiDescription Does not delete the memberid associated with the required JWT but 
 * instead deletes the contact based on the username and memberid.  
 * 
 * @apiParam {Number} memberid the member id to delete the contact from a contact list
 * 
 * @apiSuccess {boolean} success true when the contact is deleted
 * 
 * @apiError (404: Contact Not Found) {String} message "memberid not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberid must be a number" 
 * @apiError (400: Duplicate Email) {String} message "memberid not in contact list"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.delete("/:username/:memberid", (request, response, next) => {
    if (!request.params.username || !request.params.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberid must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM Contacts WHERE memberid=$1'
    let values = [request.params.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "MemberId not found"
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
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Username=$1'
    let values = [request.params.username]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.username = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response, next) => {
        //validate email exists in the chat
        let query = 'SELECT * FROM Contacts WHERE MemberId_A=$1 AND MemberId_B=$2'
        let values = [request.params.username, request.params.memberid]
    
        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "Contact doesnot exist"
                    })
                }
            }).catch(error => {
                response.status(400).send({
                    message: "SQL Error",
                    error: error
                })
            })

}, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM Contacts
                  WHERE MemberId_A=$1
                  AND MemberId_B=$2
                  RETURNING *`
    let values = [request.params.username, request.params.memberid]
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