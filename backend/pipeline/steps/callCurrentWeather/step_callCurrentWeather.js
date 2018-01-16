/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var weather = require("./src/util.js");
var watson = require('watson-developer-cloud');
var moment = require('moment');
var config = require('../../../helper/config.js').getConfig('general');
var weatherConfig = require('../../../helper/config.js').getConfig('weather');
var nluConfig = require('../../../helper/config.js').getConfig('nlu');

exports.call = function(resultHolder, callback) {
    function handleError(error) {
        const weatherErrorAnswerText = weatherConfig.errorAnswerText || 'Error getting weather data';
        resultHolder.warnings.push(error.toString());
        resultHolder.output.answer_id[0] = 'weather_error';
        resultHolder.output.text[0] = weatherErrorAnswerText;
        return callback(null, resultHolder);
    }

    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("callCurrentWeather") !== -1) {
        var defaultCity = "Mannheim";
        var inputText;
        if (resultHolder.debug.spellcheck.input) {
            inputText = resultHolder.debug.spellcheck.input;
        } else {
            inputText = resultHolder.input.text;
        }

        getLocation({
            text: inputText,
            defaultCity: defaultCity
        }, function(err, city) {
            var location = {
                longitude: 8.463,
                latitude: 49.484,
                name: city
            }
            if (err) return handleError(err);

            weather.geoLocation({
                name: location.name
            }, function(err, data) {
                if (err) return handleError(err);
                location = data;
                var today_string = moment(new Date()).format("YYYY-MM-DD");
                if (resultHolder.output['weather_date'] === "today" || resultHolder.output['weather_date'] === today_string) {

                    var responseObject;
                    weather.currentWeatherByGeolocation({
                        latitude: location.latitude,
                        longitude: location.longitude

                    }, function(err, data) {
                        if (err) return handleError(err);
                        responseObject = data;

                        if (!responseObject.observation || !responseObject.observation.temp) {
                            return handleError("no_temp_received");
                        }

                        for (var index in resultHolder.output.text) {

                            var wx_phrase = responseObject.observation.wx_phrase;
                            if (wx_phrase != null) {
                                wx_phrase = wx_phrase.toLowerCase().replace("(nachts)", "");
                            } else {
                                resultHolder.output.text[index] = resultHolder.output.text[index].replace("ist es %%wx_phrase%% bei %%temp%%", "sind es %%temp%%")
                            }

                            var temp = responseObject.observation.temp;
                            var wdir = responseObject.observation.wdir_cardinal;
                            var wspd = responseObject.observation.wspd;

                            if (wdir && wspd) {
                                if (wdir && typeof wdir === "string") {
                                    wdir = wdir.replace(/S/g, "Süd").replace(/N/g, "Nord").replace(/W/g, "West").replace(/O/g, "Ost");
                                }
                                if (wdir === "CALM") {
                                    resultHolder.output.text[index] = resultHolder.output.text[index].replace(" aus der Windrichtung %%wdir%%", "");
                                } else if (wdir === "VAR") {
                                    resultHolder.output.text[index] = resultHolder.output.text[index].replace(" aus der Windrichtung %%wdir%%", " mit wechselnder Windrichtung");
                                }
                            } else {
                                resultHolder.output.text[index] = resultHolder.output.text[index].replace("Der Wind kommt mit %%wspd%%km/h aus der Windrichtung %%wdir%%.", "");
                            }

                            resultHolder.output.text[index] = resultHolder.output.text[index].replace("%%location%%", location.name).replace("%%wx_phrase%%", wx_phrase).replace("%%temp%%", temp).replace("%%wspd%%", wspd).replace("%%wdir%%", wdir);
                        }
                        return callback(null, resultHolder);
                    });

                } else {
                    var responseObject;
                    var forecastDate = resultHolder.output['weather_date'];
                    if (config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("Forecast Date: " + forecastDate)

                    var forecastTS = Date.parse(forecastDate);
                    var today = new Date();
                    var tenDaysFromToday = new Date();
                    tenDaysFromToday.setDate(tenDaysFromToday.getDate() + 10);

                    if (forecastTS > today && forecastTS < tenDaysFromToday) {
                        weather.forecastByGeoLocation({
                            latitude: location.latitude,
                            longitude: location.longitude

                        }, function(err, data) {
                            if (err) return handleError(err);
                            responseObject = data[forecastDate];

                            try {
                                var splitDate = forecastDate.split("-");
                                var germanDate = splitDate[2] + "." + splitDate[1] + "." + splitDate[0]
                                for (var index in resultHolder.output.text) {
                                    if (resultHolder.output.text[index] === undefined) continue;
                                    resultHolder.output.text[index] = resultHolder.output.text[index].replace("%%location%%", location.name).replace("%%dow%%", responseObject.dow).replace("%%date%%", germanDate).replace("%%forecast%%", responseObject.day.narrative.replace("C.", "°C."));
                                }
                            } catch (err) {
                                return handleError(err);
                            }
                            return callback(null, resultHolder);
                        });
                    } else {
                        for (var index in resultHolder.output.text) {
                            if (resultHolder.output.text[index] === undefined) continue;
                            if (resultHolder.output.text[index].indexOf('%%location%%') !== -1) {
                                resultHolder.output.text[index] = weatherConfig.noWeatherInformation;
                            }
                        }
                        return callback(null, resultHolder);
                    }
                }
            });
        });
    } else {
        return callback(null, resultHolder);
    }
};

function getLocation(params, callback) {
    var natural_language_understanding = new watson.NaturalLanguageUnderstandingV1({
        'username': nluConfig.username,
        'password': nluConfig.password,
        'version_date': nluConfig.version,
        'url': nluConfig.url
    });

    var parameters = {
        'text': params.text,
        'features': {
            'entities': {}
        },
        'language': 'de',
        'return_analyzed_text': true
    };

    if (params.text) {
        natural_language_understanding.analyze(parameters, function(err, response) {
            if (!err) {
                var locations = params.defaultCity;

                for (var i = 0; i < response.entities.length; i++) {
                    var ent = response.entities[i];
                    if (ent.type === "Location") {
                        locations = ent.text.charAt(0).toUpperCase() + ent.text.slice(1).toLowerCase();
                    }
                }
            } else console.error('error:', err);

            if (config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("Location: ", locations)
            callback(null, locations);

        });
    } else {
        callback(null, params.defaultCity);
    }
};
