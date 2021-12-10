//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool
var url = require('url')
const sendResetEmail = require('../utilities/email').sendResetEmail
const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided
const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const bodyParser = require('body-parser');

// var bodyParser = require('body-parser')
// app.use( bodyParser.json() );       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//   extended: true
// })); 

// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

const router = express.Router()
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
router.use(bodyParser.json())


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
router.post('/', (request, response) => {
    // I need to update resetCode, put that reset code in a link inside of an email
    // Make that link open a webpage interface to reset password, submit will
    // go to another endpoint and update the password w/ new one
    // var email = request.query.email
    var subject = "Reset Password"
    sendResetEmail(request.body.email, subject);
    response.status(201).send({
        success: true
    })
})

router.get('/interface', (request, response) => {
    // need to make a form to reset password and a button that will
    // submit the change and redirect to a success page
    // Make sure the account exists
    token = [request.query.token]
    email = request.query.email
    let theQuery = "SELECT * FROM Members WHERE resetCode = $1"
    pool.query(theQuery, token).then(result => {
        console.log(token)
        console.log(email)
        //  have person fill out form with new password
        // let verificationQuery = "UPDATE MEMBERS SET verification = 1 WHERE resetCode = $1"
        let verificationQuery = "UPDATE MEMBERS SET resetCode='' WHERE resetCode = $1"
        pool.query(verificationQuery, token)
            .then(result => {
            //     console.log("here")
            //     next()
            //     // if (false) {
            //     //     response.status(404).send({
            //     //         message: "ACCESS DENIED PUNK"
            //     //     })
            //     // } else {
            //     //     next()
            //     // }
            // }).catch(error => {
            //     response.status(400).send({
            //         message: "SQL Error",
            //         error: error
            //     })
            // })
        // }, (request, response) => {

                var html =
                `
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
                    <script src="//netdna.bootstrapcdn.com/bootstrap/3.1.0/js/bootstrap.min.js"></script>
                    <script src="//code.jquery.com/jquery-1.11.1.min.js"></script>
                </head>
                
                <style>
                    body {background-image: url('https://cdn.discordapp.com/attachments/369671073240711168/909967066063331368/howlrBG1080.png');
                                          background-repeat: no-repeat;
                                          background-attachment: fixed;
                                          background-size: cover;}

                    /* Style all input fields */
                    input {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        box-sizing: border-box;
                        margin-top: 6px;
                        margin-bottom: 16px;
                    }
                    
                    /* Style the submit button */
                    input[type=submit] {
                        background-color: purple;
                        color: white;
                    }

                    
                    /* The message box is shown when the user clicks on the password field */
                    #message {
                        display:block;
                        background: #f1f1f1;
                        color: #000;
                        position: relative;
                        padding: 20px;
                        margin-top: 10px;
                    }
                    
                    #message p {
                        padding: 10px 35px;
                        font-size: 18px;
                    }
                    
                    /* Add a green text color and a checkmark when the requirements are right */
                    .valid {
                        color: green;
                    }
                    
                    .valid:before {
                        position: relative;
                        left: -35px;
                        content: "✔";
                    }
                    
                    /* Add a red text color and an "x" when the requirements are wrong */
                    .invalid {
                        color: red;
                    }
                    
                    .invalid:before {
                        position: relative;
                        left: -35px;
                        content: "✖";
                    }
                                          
                 </style>
                
                <!------ Include the above in your HEAD tag ---------->
                <body>
                    <div class="container" style="margin: auto; width: 50%; padding: 10px;">
                        <form action="/reset/performReset" method="post">
                            <label for="psw">Password</label>
                            <input type="password" id="psw" name="psw" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[$@$!%*?&])(?=.*[\d])).*$" title="Must contain at least one number and one uppercase and lowercase letter, and at least 6 or more characters" required= >

                            <input type="hidden" id="email" name="email" value="${email}"

                            <label for="pswConfirm">Confirm password</label>
                            <input type="password" id="pswConfirm" name="pswConfirm" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[$@$!%*?&])(?=.*[\d])).*$.*$" title="Must contain at least one number and one uppercase and lowercase letter, and at least 6 or more characters" required="required" >

                            <input type="submit" value="Submit">
                        </form>
                    </div>

                <div id="message" style="margin: auto; width: 50%; padding: 10px;">
                    <h3>Password must contain the following:</h3>
                    <p id="letter" class="invalid">A <b>lowercase</b> letter</p>
                    <p id="capital" class="invalid">A <b>capital (uppercase)</b> letter</p>
                    <p id="number" class="invalid">A <b>number</b></p>
                    <p id="special" class="invalid">A <b>special character</b></p>
                    <p id="length" class="invalid">Minimum <b>6 characters</b></p>
                </div>
                                
                <script>
                var password = document.getElementById("psw")
                , confirm_password = document.getElementById("pswConfirm");

                function validatePassword(){
                if(password.value != confirm_password.value) {
                    confirm_password.setCustomValidity("Passwords Don't Match");
                } else {
                    confirm_password.setCustomValidity('');
                }
                }

                password.onchange = validatePassword;
                confirm_password.onkeyup = validatePassword;



                var myInput = document.getElementById("psw");
                var letter = document.getElementById("letter");
                var capital = document.getElementById("capital");
                var number = document.getElementById("number");
                var special = document.getElementById("special");
                var length = document.getElementById("length");

                // When the user starts to type something inside the password field
                myInput.onkeyup = function() {
                // Validate lowercase letters
                var lowerCaseLetters = /[a-z]/g;
                if(myInput.value.match(lowerCaseLetters)) {  
                    letter.classList.remove("invalid");
                    letter.classList.add("valid");
                } else {
                    letter.classList.remove("valid");
                    letter.classList.add("invalid");
                }
                
                // Validate capital letters
                var upperCaseLetters = /[A-Z]/g;
                if(myInput.value.match(upperCaseLetters)) {  
                    capital.classList.remove("invalid");
                    capital.classList.add("valid");
                } else {
                    capital.classList.remove("valid");
                    capital.classList.add("invalid");
                }

                // Validate numbers
                var numbers = /[0-9]/g;
                if(myInput.value.match(numbers)) {  
                    number.classList.remove("invalid");
                    number.classList.add("valid");
                } else {
                    number.classList.remove("valid");
                    number.classList.add("invalid");
                }

                // Validate special character
                var specialChar = /(?=.*[!@#$%^&*])/g;
                if(myInput.value.match(specialChar)) {  
                    special.classList.remove("invalid");
                    special.classList.add("valid");
                } else {
                    special.classList.remove("valid");
                    special.classList.add("invalid");
                }
                
                // Validate length
                if(myInput.value.length >= 6) {
                    length.classList.remove("invalid");
                    length.classList.add("valid");
                } else {
                    length.classList.remove("valid");
                    length.classList.add("invalid");
                }
                }
                </script>

`
                
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.write(html);
                response.end();
            }).catch(e => console.log('error', e))
    })
})


router.post('/performReset', (request, response) => {
    const password = request.body.psw
    const email = request.body.email
    console.log(email)
    console.log(password)
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(isStringProvided(password)) {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = generateSalt(32)
        let salted_hash = generateHash(password, salt)
        
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let theQuery = "UPDATE MEMBERS SET Password=$1, Salt=$2 WHERE email = $3"
        let values = [salted_hash, salt, email]
        pool.query(theQuery, values)
            .then(result => {
                // //We successfully added the user!
                // response.status(201).send({
                //     success: true
                // })
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
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == "members_username_key") {
                    response.status(400).send({
                        message: "Username exists"
                    })
                } else if (error.constraint == "members_email_key") {
                    // response.status(400).send({
                        // message: "Email exists"
                    // })
                } else {
                    console.log('register')
                    // response.status(400).send({
                        // message: "other error, see detail",
                        // detail: error.detail
                    // })
                }
            })
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
})

module.exports = router