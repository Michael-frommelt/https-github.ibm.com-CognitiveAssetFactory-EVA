/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var db = require('./db/db.js').getDatabase();

var config = {};

exports.init = function(callbackSuccess, callbackError) {
    db.getAllConfigs(function(resultArray) {
        for (let index in resultArray) {
            let configObject = resultArray[index];
            delete configObject._id;
            let key = configObject.id;
            config[key] = configObject;
        }

        return callbackSuccess();
    }, function(errReason) {
        return callbackError({
            message: 'Could_not_load_configs',
            error: errReason
        })
    });
};

exports.getConfig = function(key) {
    if (config[key] !== undefined) {
        return config[key];
    } else {
        console.error('config object with key: ' + key + ' not found.');
        return undefined;
    }
};
