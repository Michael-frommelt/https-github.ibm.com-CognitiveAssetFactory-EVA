/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

'use strict';

var dbconfig = require('../config.js');
var mongoClient = require('mongodb').MongoClient;

exports.init = function(callbackSuccess, callbackError) {
    var connObject = {
        ssl: true,
        sslValidate: true,
        poolSize: 1,
        reconnectTries: 1
    };
    if(dbconfig.credentials.ca_certificate_base64 && dbconfig.credentials.ca_certificate_base64.length > 0) {
        var ca = [new Buffer(dbconfig.credentials.ca_certificate_base64, 'base64')];
        connObject.sslCA = ca;
    }
    mongoClient.connect(dbconfig.credentials.uri, connObject,
        function(err, database) {
            if (err) return callbackError('MongoDB', err);
            globalDatabase.connection = database.db(dbconfig.credentials.instance);
            return callbackSuccess('MongoDB');
        }
    );
};
