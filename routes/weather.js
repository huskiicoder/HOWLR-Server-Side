const API_OPEN = process.env.WEATHER_API_KEY_OPEN
const API_GOOGLE = process.env.GOOGLE_API_KEY

const { response } = require('express')
//express is the framework we're going to use to handle requests
const express = require('express')

//request module is needed to make a request to a web service
const request = require('request')

var router = express.Router()

/**
 * @api {get} /weather/ Request a list of weather
 * @apiName GetWeather
 * @apiGroup Weather
 * 
 * @apiHeader {String} authorization JWT provided from Auth get
 * 
 * @apiDescription This end point is a pass through to the OpenWeather API. 
 * 
 */ 
 router.get("/", (req, res) => {
    res.type("application/json");
    if (req.query.zipcode) {
        zipcode = req.query.zipcode;
        let googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${API_GOOGLE}`
        // let googleUrl ="https://maps.googleapis.com/maps/api/geocode/json?address=" + zipcode + "&key=" + API_GOOGLE;
        request(googleUrl, function(error, response, body) {
            if (error) {
                res.send(error);
            } else {
                let googleGeo = JSON.parse(body);
                let lat = googleGeo.results[0].geometry.location.lat;
                let lon = googleGeo.results[0].geometry.location.lng;
                let locationInfo = googleGeo.results[0].address_components;
                let cityName = "Unknown";
                for (let i = 0; i < locationInfo.length; i++) {
                    if (locationInfo[i].types.includes("locality") ||
                        locationInfo[i].types.includes("sublocality") ||
                        locationInfo[i].types.includes("sublocality_level_1")) {
                        cityName = locationInfo[i].short_name;
                        break;
                    }
                }
                let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=imperial&appid=${API_OPEN}`
                request(url, function (error, response, body) {
                    if (error) {
                        res.send(error)
                    } else {
                        var n = body.indexOf("{")
                        var nakidBody = body.substring(n - 1)

                        res.send({
                            city: cityName,
                            weather: nakidBody
                        })
                    }
                })
            }
        })
    } else if (req.query.lat && req.query.lon) {

        let lat = req.query.lat;
        let lon = req.query.lon;
        let latlng = lat + "," + lon;
        let googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${API_GOOGLE}`

        request(googleUrl, function (error, response, body) {
            if (error) {
                res.send(error);
            } else {
                let zip = "N/A";
                let cityName = "Unknown";
                let locationInfo = JSON.parse(body).results[0].address_components;
                for (let i = 0; i < locationInfo.length; i++) {
                    if (locationInfo[i].types.includes("locality") ||
                        locationInfo[i].types.includes("sublocality") ||
                        locationInfo[i].types.includes("sublocality_level_1")) {
                        cityName = locationInfo[i].short_name;
                    }
                    if (locationInfo[i].types.includes("postal_code")) {
                        zip = locationInfo[i].short_name;
                    }
                }
                let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=imperial&appid=${API_OPEN}`

                request(url, function (error, response, body) {
                    if (error) {
                        res.send(error)
                    } else {

                        var n = body.indexOf("{")
                        var nakidBody = body.substring(n - 1)

                        res.send({
                            city: cityName,
                            weather: nakidBody
                        })
                    }
                })
            }
        })
    }
})

module.exports = router