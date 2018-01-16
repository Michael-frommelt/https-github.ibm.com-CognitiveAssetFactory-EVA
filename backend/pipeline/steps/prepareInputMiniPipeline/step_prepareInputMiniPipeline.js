/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

var jumpHandlingConfig = require('../../../helper/config.js').getConfig('jumpHandling');

exports.call = function(inputObject, resultHolder, callback) {
    // validate input data
    // clientId needs to be a non-empty string
    if (inputObject == null || !typeof inputObject.clientId === 'string' || inputObject.clientId.trim() === '') {
        return callback({
            code: 400,
            message: 'Invalid_clientId'
        }, null);
    }

    resultHolder.debug = {};
    resultHolder.debug.calledFunctions = [];

    resultHolder.answerFrom = "config";

    resultHolder.user = inputObject.user;
    resultHolder.clientId = inputObject.clientId;

    resultHolder.input = inputObject.input;
    resultHolder.originalInput = {};
    resultHolder.output = {};
    resultHolder.output.answer_id = inputObject.answerIds;
    resultHolder.output.actions = [];
    resultHolder.output.lockLevel = 0;
    resultHolder.warnings = [];

    resultHolder.mode = inputObject.mode;

    if(resultHolder.mode === 'maintenanceMode') {
        resultHolder.output.lockLevel = 3;

        resultHolder.session = {};
    }

    if(resultHolder.mode === 'welcomeMessageFromConfig') {
        resultHolder.output.isWelcome = true;

        if (inputObject.session[inputObject.clientId] === undefined || inputObject.session[inputObject.clientId] === null) inputObject.session[inputObject.clientId] = {};
        if (inputObject.session[inputObject.clientId].watson === undefined) inputObject.session[inputObject.clientId].watson = {};
        resultHolder.session = inputObject.session[inputObject.clientId].watson;
        resultHolder.session.context = {
            system: jumpHandlingConfig.openingSystemContext
        };
    }

    return callback(null, resultHolder);
};
