/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var dbconfig = require('../config.js');
var Cloudant = require('@cloudant/cloudant');

exports.init = function(callbackSuccess, callbackError) {
    Cloudant({
        account: dbconfig.credentials.account,
        password: dbconfig.credentials.password,
        plugins: ['retry'],
        maxAttempt: 15,
        retryInitialDelayMsecs: 1300
    }, function(err, database) {
        if (err) {
            return callbackError("Cloudant", err);
        } else {
            globalDatabase.connection = database.db;

            return callbackSuccess("Cloudant");
        }
    });
};
