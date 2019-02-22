/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

'use strict';

var dbconfig = require('../config.js');
var mongoClient = require('mongodb').MongoClient;

exports.init = function(callbackSuccess, callbackError) {
    var connObject = {
        ssl: true,
        sslValidate: true,
        poolSize: 1,
        reconnectTries: 1,
	    useNewUrlParser: true
    };
    if(dbconfig.credentials.ca_certificate_base64 && dbconfig.credentials.ca_certificate_base64.length > 0) {
        var ca = [Buffer.from(dbconfig.credentials.ca_certificate_base64, 'base64')];
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
