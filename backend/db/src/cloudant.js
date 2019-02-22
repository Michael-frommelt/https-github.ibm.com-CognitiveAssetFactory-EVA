/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
