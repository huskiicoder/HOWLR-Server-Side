const API_KEY = process.env.WEATHER_API_KEY

//express is the framework we're going to use to handle requests
const express = require('express')

//request module is needed to make a request to a web service
const request = require('request')

var router = express.Router()

/**
 * @api {get} /weather/current get the current weather
 * @apiName WEATHERBITAPI
 * @apiGroup WEATHERBIT
 * 
 * @apiHeader {String} city or zipcode
 * 
 * @apiDescription This end point is a pass through to the weatherbit.io. 
 * All parameters will pass on to https://api.weatherbit.io/v2.0/current.
 * See the <a href="https://www.weatherbit.io/api/weather-current">weatherbit.io documentation</a>
 * for a list of optional paramerters and expected results. You do not need a 
 */ 
router.get("/current", (req, res) => {

    // for info on use of tilde (`) making a String literal, see below. 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
    let url = `https://api.weatherbit.io/v2.0/current?lat=&lon=&key=${API_KEY}&include=minutely`
    
    //find the query string (parameters) sent to this end point and pass them on to
    // phish.net api call 
    let n = req.originalUrl.indexOf('?') + 1
    if(n > 0) {
        url += '&' + req.originalUrl.substring(n)
    }

    //When this web service gets a request, make a request to the Phish Web service
    request(url, function (error, response, body) {
        if (error) {
            res.send(error)
        } else {
            // pass on everything (try out each of these in Postman to see the difference)
            // res.send(response);
            
            // or just pass on the body

            var n = body.indexOf("{")
            var nakidBody = body.substring(n - 1)

            res.send(nakidBody)
        }
    })

})

module.exports = router