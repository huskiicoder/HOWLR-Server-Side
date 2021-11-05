const API_KEY = process.env.WEATHER_API_KEY
const IP_TOKEN = process.env.TOKEN

const { response } = require('express')
//express is the framework we're going to use to handle requests
const express = require('express')

const getPostalUrl = require('../utilities').getPostalUrl

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

//request module is needed to make a request to a web service
const request = require('request')

var router = express.Router()

/**
 * @api {get} /weather/current Request the current weather
 * @apiName GetWeather
 * @apiGroup Weather
 * 
 * @apiHeader {String} zipcode
 * 
 * @apiDescription This end point is a pass through to the weatherbit.io. 
 * All parameters will pass on to https://api.weatherbit.io/v2.0/current.
 * See the <a href="https://www.weatherbit.io/api/weather-current">weatherbit.io documentation</a>
 * for a list of optional paramerters and expected results.
 */ 
router.get("/current", (req, res) => {

    getPostalUrl(`https://ipinfo.io/json?token=${IP_TOKEN}`, (err, value) => {
        if (err) return console.error(err);
         // for info on use of tilde (`) making a String literal, see below. 
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
        let url = `https://api.weatherbit.io/v2.0/current?postal_code=${value}&key=${API_KEY}&include=minutely`

        // let url = `https://api.weatherbit.io/v2.0/forecast/daily?postal_code=${value}&key=${API_KEY}&days=10`
        //When this web service gets a request, make a request to the Weather Web service
        request(url, function (error, response, body) {
            if (error) {
                res.send(error)
            } else {
                var n = body.indexOf("{")
                var nakidBody = body.substring(n - 1)

                res.send(nakidBody)
            }
        })
    });

})

/**
 * @api {post} /weather/current Request the current weather based on zipcode
 * @apiName PostWeather
 * @apiGroup Weather
 * 
 * @apiHeader {String} zipcode
 * 
 * @apiDescription This end point is a pass through to the weatherbit.io. 
 * All parameters will pass on to https://api.weatherbit.io/v2.0/current.
 * See the <a href="https://www.weatherbit.io/api/weather-current">weatherbit.io documentation</a>
 * for a list of optional paramerters and expected results.
 */ 
 router.post("/current", (req, res) => {
    const zipcode = req.body.zipcode
    console.log(zipcode)
    if (isStringProvided(zipcode)) {
        let url = `https://api.weatherbit.io/v2.0/current?postal_code=${zipcode}&key=${API_KEY}&include=minutely`
        //When this web service gets a request, make a request to the Weather Web service
        request(url, function (error, response, body) {
            if (error) {
                res.send(error)
            } else {
                var n = body.indexOf("{")
                var nakidBody = body.substring(n - 1)

                res.send(nakidBody)
            }
        })
    } else {
        res.status(400).send({
            message: "Missing required information"
        })
    }
})

module.exports = router