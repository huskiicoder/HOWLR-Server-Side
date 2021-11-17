//express is the framework we're going to use to handle requests
const express = require('express')
//Create a new instance of express
const app = express()

let middleware = require('./middleware')

/*
 * This middleware function parses JASOn in the body of POST requests
 */
app.use(express.json())

/*
 * This middleware function will respond to improperly formed JSON in 
 * request parameters.
 */
app.use(middleware.jsonErrorInBody)

app.use('/auth', require('./routes/signin.js'))

app.use('/auth', require('./routes/register.js'))

app.use('/confirm', require('./routes/confirm.js'))

app.get("/wait", (request, response) => {
    setTimeout(() => {
        response.send({
            message: "Thanks for waiting"
        });
    }, 5000)
})

app.use('/weather', middleware.checkToken, require('./routes/weather.js'))

app.use('/messages', middleware.checkToken, require('./routes/messages.js'))

app.use('/chats', middleware.checkToken, require('./routes/chats.js'))

app.use('/contacts', middleware.checkToken, require('./routes/contacts.js'))

app.use('/auth', middleware.checkToken, require('./routes/pushyregister.js'))
/*
 * Return HTML for the / end point. 
 * This is a nice location to document your web service API
 * Create a web page in HTML/CSS and have this end point return it. 
 * Look up the node module 'fs' ex: require('fs');
 */
app.get("/", (request, response) => {
    //this is a Web page so set the content-type to HTML
    var html = `
    <head>
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
    <p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://cdn.discordapp.com/attachments/369671073240711168/909994235233730601/sadhowlrLogo.png" width="307" height="309" /></p>
    <h1 style="text-align: center;">*Sad Husky Noises*</h1>
    <h2 style="text-align: center;">You must not be on mobile, open the app on your phone to continue to use HOWLR.</h2>
    </body>
    `
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(html); 
    response.end(); //end the response
});

/*
 * Serve the API documentation generated by apidoc as HTML. 
 * https://apidocjs.com/
 */
app.use("/doc", express.static('apidoc'))

/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* To access an environment variable, use process.env.<ENV>
* If there isn't an environment variable, process.env.PORT will be null (or undefined)
* If a value is 'falsy', i.e. null or undefined, javascript will evaluate the rest of the 'or'
* In this case, we assign the port to be 5000 if the PORT variable isn't set
* You can consider 'let port = process.env.PORT || 5000' to be equivalent to:
* let port; = process.env.PORT;
* if(port == null) {port = 5000} 
*/ 
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});