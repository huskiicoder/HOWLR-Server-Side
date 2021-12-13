//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const contact_functions = require('../utilities/exports').contact

/**
 * @api {post} /contacts Request to add a new contact to the DB
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiParam {String} username A or email A
 * @apiParam {String} username B or email B
 * 
 * @apiSuccess (Success 201) {boolean} success true when the member id is inserted
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
    let query = 'SELECT memberid, firstname, lastname, username FROM MEMBERS WHERE username=$1'
    let values = [request.body.usernameA]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                response.message = result.rows[0];
                request.body.usernameA = result.rows[0].memberid;
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
    let query = 'SELECT MemberID FROM MEMBERS WHERE username=$1'
    let values = [request.body.usernameB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.body.usernameB = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response, next) => {
    //validate member does not already exist in the contact
    let query = `SELECT * FROM Contacts WHERE (MemberId_A=$1 AND MemberId_B=$2)
                    OR (MemberId_A=$2 AND MemberId_B=$1)`
    let values = [request.body.usernameA, request.body.usernameB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                response.status(400).send({
                    message: "Contact already exists"
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

},(request, response, next) => {
    // Insert a new contact into Contacts database when an user send the friend request
    const theQuery = `INSERT INTO CONTACTS(MemberID_A, MemberID_B) VALUES($1,$2) RETURNING *`
    const values = [request.body.usernameA, request.body.usernameB]

    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 1) {
                next();
                response.locals=result.rows[0]
            } else {
                response.status(400).send({
                    "message": "unknown error"
                })
            }
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })    
        })
}, (request, response) => {
    // send a notification of this friend request to the receiver.
    let query = `SELECT token FROM Push_Token
                INNER JOIN Contacts
                ON Push_Token.memberid = Contacts.memberid_b
                WHERE Contacts.memberid_a=$1 and Contacts.memberid_b=$2`
    let values = [request.body.usernameA, request.body.usernameB]
    pool.query(query, values)
        .then(result => {
            console.log(response.message)
            contact_functions.sendContactToIndividual(
                result.rows[0].token,
                response.message)

            response.send({
                success:true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error on select from push token",
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
 * @apiParam {String} email the user who look up their contact list 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the a contact list
 * @apiSuccess {Object[]} invitation List of contacts in the a invitation list
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
                response.message = result.rows[0]
                // console.log(response.message)
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
        let query = `SELECT Members.MemberID, Members.Username, Members.Lastname, Members.Firstname, 
                    Contacts.Verified, Contacts.MemberId_B FROM Members
                    INNER JOIN Contacts ON (Members.MemberId=Contacts.MemberId_A
                    AND Contacts.MemberId_B=(Select MemberID from Members where email=$1))
                    OR (Contacts.MemberId_A=(Select MemberID from Members where email=$1)
                    AND Members.MemberId=Contacts.MemberId_B)`
        let values = [request.params.email]
        pool.query(query, values)
            .then(result => {
                let contactResult = result.rows;
                let inviteList = [];
                let contactList = [];
                contactResult.forEach(function(contact) {
                    let verified = contact.verified;
                    let memberid_b = contact.memberid_b;
                    // console.log(contact)
                    // console.log("memberid_b: " + memberid_b)
                    // console.log("memberid: " + response.message.memberid)
                    delete contact.verified;
                    delete contact.memberid_b;
                    if (verified == 0 && memberid_b === response.message.memberid) {
                        inviteList.push(contact);
                    } else {
                        contactList.push(contact);
                    }
                })
                response.send({
                    succes: true,
                    invitation: inviteList,
                    contact: contactList
                })
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                })
            })
});

/**
 * @api {get} /contacts/search/:email/:search Search an user using email, firstname, lastname
 * @apiName GetUser
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} email the user who look up their contact list 
 * @apiParam {String} search string the contact info to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the a contact list
 * 
 * @apiError (404: Email Not Found) {String} message "User Not Found"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 

router.get("/search/:email/:search", (request, response, next) => {
    if (!request.params.email || !request.params.search) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
},  (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM MEMBERS WHERE email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.email = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    // Select the member who is in the contact list
    let query = `SELECT Members.MemberID, Members.Username, Members.Lastname, Members.Firstname FROM MEMBERS 
                WHERE (upper(Email) LIKE upper($2) OR upper(FirstName) LIKE upper($2) OR upper(LastName) LIKE upper($2))
                AND Members.MemberID != $1
                EXCEPT SELECT Members.MemberID, Members.Username, Members.Lastname, Members.Firstname
                FROM Members
                INNER JOIN Contacts ON (Members.MemberId=Contacts.MemberId_A AND Contacts.MemberId_B=$1)
                OR (Contacts.MemberId_A=$1 AND Members.MemberId=Contacts.MemberId_B)`
    let value = '%' + request.params.search + '%'
    let values = [request.params.email, value]

    pool.query(query, values)
        .then(result => {
            response.send({
                succes: true,
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
 * @api {get} /contacts/name Retrieve first and last name of user
 * @apiName GetUserFirstAndLast
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} email email of the user. 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts first and last name of user
 * 
 * @apiError (404: Email Not Found) {String} message "User Not Found"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 

 router.get("/name/:email", (request, response, next) => {
    if (!request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    }
    else {
        next()
    }
},  (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT firstname, lastname FROM MEMBERS WHERE email=$1'
    let values = [request.params.email]
    pool.query(query, values)
        .then(result => {
            response.send({
                success: true,
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
 * @api {get} /contacts/searchContact/:email/:search Search an existing contact using email, firstname, lastname
 * @apiName GetUser
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} email email of the user who search their contacts. 
 * @apiParam {String} search string the contact info to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the a contact list
 * 
 * @apiError (404: Email Not Found) {String} message "User Not Found"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 

 router.get("/searchContact/:email/:search", (request, response, next) => {
    if (!request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    }
    else {
        next()
    }
},  (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM MEMBERS WHERE email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.email = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    // Select the member who is in the contact list
    let query = `SELECT Members.MemberID, Members.Username, Members.Lastname, Members.Firstname FROM MEMBERS 
            INNER JOIN Contacts ON (Members.MemberId=Contacts.MemberId_A AND Contacts.MemberId_B=$1)
            OR (Contacts.MemberId_A=$1 AND Members.MemberId=Contacts.MemberId_B)
            WHERE (upper(Email) LIKE upper($2) OR upper(FirstName) LIKE upper($2) OR upper(LastName) LIKE upper($2))
            AND Members.MemberID != $1 AND contacts.verified=1`
    let value = '%' + request.params.search + '%'
    let values = [request.params.email, value]

    pool.query(query, values)
        .then(result => {
            response.send({
                succes: true,
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
 * @apiParam {String} user the user want to delete the contact in their contact list
 * @apiParam {Number} memberid the member id to delete the contact from a contact list
 * 
 * @apiSuccess {boolean} success true when the contact is deleted
 * 
 * @apiError (404: Member Not Found) {String} message "memberid not found"
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
    //validate memberid exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
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
        //validate contact exists in the contacts
        let query = `SELECT * FROM Contacts WHERE (MemberId_A=$1 AND MemberId_B=$2)
                    OR (MemberId_A=$2 AND MemberId_B=$1)`
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
    //Delete the memberId from the contact
    let insert = `DELETE FROM Contacts
                  WHERE (MemberId_A=$1
                  AND MemberId_B=$2)
                  OR (MemberId_A=$2
                    AND MemberId_B=$1)`
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
    })

/**
 * @api {put} /contact/accept/:username/:memberId Change the verified of the contacts to 1 when friend request is accepted
 * @apiName PutContact
 * @apiGroup Contact
 *
 * @apiDescription Sets verified to 1 when the invitation is accepted
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {String} username the username of the member who accept the contact request
 * @apiParam {Number} memberId the id of the member who sent the contact request
 *
 * @apiSuccess (Success 201) {boolean} success true when the contact is verified
 *
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (404: Member Not Found) {String} message "Member not found"
 * @apiError (404: Contact Not Found) {String} message "Contact does not exist"
 * 
 * @apiUse JSONError
 */
router.put("/accept/:username/:memberId", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.username || !request.params.memberId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next();
    }
}, (request, response, next) => { 
    //validate the memberId
    let query = 'SELECT * FROM Members WHERE MemberId=$1'
    let values = [request.params.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member not found"
                })
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error M",
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
    //validate the contact
    let query = `SELECT * 
                FROM Contacts 
                WHERE MemberID_A=$2 AND MemberID_B=$1`
    let values = [request.params.username, request.params.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact does not exist"
                })
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error C",
                error: error
            })
        })
}, (request, response) => {
    //set contact to verified
    let update = `UPDATE Contacts 
                SET Verified = 1 
                WHERE MemberID_A=$2 AND MemberID_B=$1`
    let values = [request.params.username, request.params.memberId];
   pool.query(update, values)
        .then(result => {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                decode: request.params.username,
                query: request.params.memberId,
                error: err
            })
        })
})

/**
 * @api {post} /contacts/messages
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiParam {String} memberid A
 * @apiParam {String} memberid B
 * @apiParam {String} name Name of the chat
 * 
 * @apiSuccess (Success 201) {boolean} success true when the member id is inserted
 * @apiSuccess {Number} rowCount the number of contacts returned
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (404: Memberid Not Found) {String} message "Member Not Found"
 * @apiError (404: Memberid Not Found) {String} message "Member Not Found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
 router.post("/messages", (request, response, next) => {
    if (!request.body.memberidA && !request.body.memberidB && !isStringProvided(request.body.name)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate memberid exists
    let query = 'SELECT * FROM MEMBERS WHERE memberid=$1'
    let values = [request.body.memberidA]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "Validate memberid SQL Error",
                error: error
            })
        })
},(request, response, next) => {
    //validate memberid exists
    let query = 'SELECT * FROM MEMBERS WHERE memberid=$1'
    let values = [request.body.memberidB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "Validate memberid SQL Error",
                error: error
            })
        })
}, (request, response, next) => {
    //validate if chat exits
    let query = `Select A.chatid as chatid from chatmembers 
                Join (Select chatid, count(*) as total from chatmembers 
                Where chatid in (Select chatid from chatmembers where memberid=$1) group by chatid) As A
                ON chatmembers.chatid=A.chatid Where A.total = 2 and Chatmembers.memberid=$2`
    let values = [request.body.memberidA, request.body.memberidB]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) { 
                response.send({
                   chatID: result.rows[0].chatid
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "Valid chat: SQL Error",
                error: error
            })
        })

}, (request, response, next) => {

    let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`
    let values = [request.body.name]
    pool.query(insert, values)
        .then(result => {
            request.body.name = result.rows[0].chatid
            console.log(result.rows[0])
            next()
        }).catch(err => {
            response.status(400).send({
                message: "Insert SQL Error",
                error: err
            })

        })
}, (request, response) => {
    let chatID = request.body.name
    let query = 'INSERT INTO ChatMembers(chatID, MemberID) Values';
    query += '(' + chatID + ',' + request.body.memberidA + '),';
    query += '(' + chatID + ',' + request.body.memberidB + ') RETURNING *';
    console.log(query);
    let values = null;
    pool.query(query,values)
        .then(result => {
            response.send({
                success: true,
                rows: result.rows[0]
            })
        }).catch(err => {
            response.status(400).send({
                message: "Insert chatmembers SQL Error",
                error: err
            })

        })
})

module.exports = router