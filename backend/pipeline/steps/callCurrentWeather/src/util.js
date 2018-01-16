/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';
var pick = require('object.pick');
var format = require('string-template');
var extend = require('extend');
var fields = ['temp', 'pop', 'uv_index', 'narrative', 'phrase_12char', 'phrase_22char', 'phrase_32char'];
var weatherConfig = require('../../../../helper/config.js').getConfig('weather');

var requestNoAuthDefaults = {
  jar: true,
  json: true
};
var weatherKey = '';
var request;
var timeout = 5000;

module.exports = {

  geoLocation: function(params, callback) {
    var requestDefaults = {
      auth: {
        username:  weatherConfig.username,
        password:  weatherConfig.password,
        sendImmediately: true
      },
      jar: true,
      json: true
    };

    if (!params.name) {
      callback('name cannot be null')
    }

    // If API Key is not provided use auth. credentials from Bluemix
    var qString;
    var locationData = {};
    if (!weatherKey) {
        request = require('request').defaults(requestDefaults);
        qString = {
                query: params.name,
                locationType: 'city',
                //countryCode: 'DE',
                language: 'de-DE'
                };
     }else{
        request = require('request').defaults(requestNoAuthDefaults);
        qString = {
                    query: params.name,
                    locationType: 'city',
                    countryCode: 'DE',
                    language: 'de-DE',
                    apiKey: weatherKey,
                    format : 'json'
                  };
     }
    request({
      method: 'GET',
      url: "https://" + weatherConfig.host + "/api/weather/v3/location/search",
      qs: qString,
      timeout: timeout
    }, function(err, response, body) {
      if (err) {
        callback(err);
      } else if(response.statusCode != 200) {
        callback('Error http status: ' + response.statusCode);
      } else if (body.errors && body.errors.length > 0){
        callback(body.errors[0].error.message);
      } else {

        var location = body.location;
        if (location.length > 0 ) {
          location = location[0];
        }

        // Take first entry (best)
        locationData = {
            longitude: location.longitude[0],
            latitude: location.latitude[0],
            name : params.name
        };
        callback(null, locationData)
       };
      });
      },

  forecastByGeoLocation : function(params, callback) {
    var requestDefaults = {
      auth: {
        username:  weatherConfig.username,
        password:  weatherConfig.password,
        sendImmediately: true
      },
      jar: true,
      json: true
    };

    var _params = extend({ range: '10day' }, params);

    if (!_params.latitude || !_params.longitude) {
      callback('latitude and longitude cannot be null')
    }
       var qString;
       if (!weatherKey) {
            request = require('request').defaults(requestDefaults);
            qString = {
                     //units: 'e',
                     language: 'de-DE'
                     };
         } else {
            request = require('request').defaults(requestNoAuthDefaults);
             qString = {
                     //units: 'e',
                     language: 'de-DE',
                     apiKey: weatherKey
                     };
          }
     request({
      method: 'GET',
      url: format("https://" + weatherConfig.host + "/api/weather/v1/geocode/{latitude}/{longitude}/forecast/daily/{range}.json", _params),
      qs: qString,
      timeout: timeout
    }, function(err, response, body) {
      if (err) {
        callback(err);
      } else if(response.statusCode != 200) {
        callback('Error getting the forecast: HTTP Status: ' + response.statusCode);
      } else {
        var forecastByDay = {};
        body.forecasts.forEach(function(f) {
          // Pick night time forecast if day time isn't available from Weather API
        var fdate = f.fcst_valid_local.split("T")[0]
          if (!forecastByDay[fdate]) {
            var dayFields = pick(f.day,fields);
            if (Object.keys(dayFields).length === 0){
              forecastByDay[fdate] = {
                dow: f.dow,
                night: pick(f.night, fields)
              };
            }else{
              forecastByDay[fdate] = {
                dow: f.dow,
                day: pick(f.day, fields),
                night: pick(f.night, fields)
              };
            };
        };
        });
        callback(null, forecastByDay);
      }
    });
  },


 currentWeatherByGeolocation : function(params, callback) {
   var requestDefaults = {
     auth: {
       username:  weatherConfig.username,
       password:  weatherConfig.password,
       sendImmediately: true
     },
     jar: true,
     json: true
   };

    var _params = params;

    if (!_params.latitude || !_params.longitude) {
      callback('latitude and longitude cannot be null')
    }
       var qString;
       if (!weatherKey) {
            request = require('request').defaults(requestDefaults);
            qString = {
                     //units: 'c',
                     language: 'de-DE'
                     };
         } else {
            request = require('request').defaults(requestNoAuthDefaults);
             qString = {
                     //units: 'c',
                     language: 'de-DE',
                     apiKey: weatherKey
                     };
          }
     request({
      method: 'GET',
      url: format("https://" + weatherConfig.host + "/api/weather/v1/geocode/{latitude}/{longitude}/observations.json", _params),
      qs: qString,
      timeout: timeout
    }, function(err, response, body) {
      if (err) {
        callback(err);
      } else if(response.statusCode != 200) {
        callback('Error getting the forecast: HTTP Status: ' + response.statusCode);
      } else {
        var currentWeather = body;
        callback(null, currentWeather);
      }
    });
  }
}
