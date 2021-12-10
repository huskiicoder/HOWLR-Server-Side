const pool = require("./sql_conn");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport")
const { response } = require("express");


let sendEmail = (sender, receiver, subject, message) => {
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account 
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

    // figuring out how to do this verification email thing

    // setting up SMTP
    const password = 'Burner123!'
    const email = 'welcometohowlr@gmail.com'
    const transport = nodemailer.createTransport(smtpTransport({
        service:"gmail",
        auth: {
            user: email,
            pass: password,
        },
    }))

    // create token to store in DB and send to user email
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let token = ''
    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length)];
    }

    // store in DB, $1 = token, $2 = receiver
    const theQuery = "UPDATE Members SET confirmCode = $1 WHERE email=$2"
    const values = [token, receiver]
    pool.query(theQuery, values)
            .then(result => {
                // Confirmation code successfully added to DB, send the email to the user
                var mailOptions = {
                    from: email,
                    to: receiver,
                    subject: subject,
                    html: `<h1>Email Confirmation</h1>
                    <h2>Hello ${receiver}</h2>
                    <p>Thank you for subscribing to Howlr! Please confirm your email by clicking the following link:</p>
                    <a href=http://howlr-server-side.herokuapp.com/confirm?token=${token}> Click here</a>
                    </div>`,
                };

                transport.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent:' + info.response);
                    }
                });
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == "members_username_key") {
                    console.log('oops1')
                    // response.status(400).send({
                    //     message: "Username exists"
                    // })
                } else if (error.constraint == "members_email_key") {
                    console.log('oops2')
                    // response.status(400).send({
                    //     message: "Email exists"
                    // })
                } else {
                    // console.log('oops3')
                    // response.status(400).send({
                    //     message: "other error, see detail",
                    //     detail: error.detail
                    // })
                }
            })



}

let sendResetEmail = (receiver, subject) => {
    // setting up SMTP
    const password = 'Burner123!'
    const email = 'welcometohowlr@gmail.com'
    const transport = nodemailer.createTransport(smtpTransport({
        service:"gmail",
        auth: {
            user: email,
            pass: password,
        },
    }))

    // create token to store in DB and send to user email
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let token = ''
    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length)];
    }
    // store in DB, $1 = token, $2 = receiver
    const theQuery = "UPDATE Members SET resetCode = $1 WHERE email=$2"
    const values = [token, receiver]
    pool.query(theQuery, values)
            .then(result => {
                // Confirmation code successfully added to DB, send the email to the user
                var mailOptions = {
                    from: email,
                    to: receiver,
                    subject: subject,
                    html: `<h1>Reset Password</h1>
                    <h2>Hello ${receiver}</h2>
                    <p>You recently requested to reset your password. Click the link below to continue.</p>
                    <a href=http://howlr-server-side.herokuapp.com/reset/interface?token=${token}&email=${receiver}>Reset Password</a>
                    <p>If you did not make this change or if you believe an unauthorized person has accessed your account, please
                    reset your password immediately with the "Forgot password?" button on the apps sign-in page.</p>
                    </div>`,
                };

                transport.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent:' + info.response);
                    }
                });
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == "members_username_key") {
                    console.log('oops1')
                    // response.status(400).send({
                    //     message: "Username exists"
                    // })
                } else if (error.constraint == "members_email_key") {
                    console.log('oops2')
                    // response.status(400).send({
                    //     message: "Email exists"
                    // })
                } else {
                    console.log('oops3')
                    response.status(400).send({
                        message: "other error, see detail",
                        detail: error.detail
                    })
                }
                console.log(member)
            }
            
        )}

module.exports = { 
    sendEmail,
    sendResetEmail
}