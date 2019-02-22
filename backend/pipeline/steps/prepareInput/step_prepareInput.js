/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

exports.call = function(inputObject, resultHolder, callback) {
    // validate input data
    // clientId needs to be a non-empty string
    if (inputObject == null || !typeof inputObject.clientId === 'string' || inputObject.clientId.trim() === '') {
        return callback({
            code: 400,
            message: 'Invalid_clientId'
        }, null);
    }
    // input.text can be absent, but needs to be a string if present
    if (inputObject != null && inputObject.input != null && inputObject.input.text != null && typeof inputObject.input.text !== 'string') {
        return callback({
            code: 400,
            message: 'Invalid_input_text'
        }, null);
    }

    if (inputObject.session[inputObject.clientId] === undefined || inputObject.session[inputObject.clientId] === null) inputObject.session[inputObject.clientId] = {};
    if (inputObject.session[inputObject.clientId].watson === undefined) inputObject.session[inputObject.clientId].watson = {};
    resultHolder.session = inputObject.session[inputObject.clientId].watson;

    resultHolder.isTest = inputObject.isTest;

    resultHolder.debug = {};
    resultHolder.debug.calledFunctions = [];

    resultHolder.answerFrom = "";

    resultHolder.user = inputObject.user;
    resultHolder.clientId = inputObject.clientId;

    resultHolder.input = {};
    resultHolder.originalInput = {};
    resultHolder.output = {};
    resultHolder.output.answer_id = [];
    resultHolder.output.actions = [];
    resultHolder.output.lockLevel = 0;
    resultHolder.warnings = [];

    if (resultHolder.session.context === undefined) {
        resultHolder.session.context = {};
    }

    if (resultHolder.session.messageId === undefined) {
        resultHolder.session.messageId = 0;
    } else {
        resultHolder.session.messageId++;
    }

    if (inputObject.input) {
        resultHolder.input = inputObject.input;
        resultHolder.originalInput = JSON.parse(JSON.stringify(inputObject.input));
    }

    if ((!inputObject.input || !inputObject.input.text || inputObject.input.text === "") && resultHolder.session.messageId === 0) {
        resultHolder.welcomeMessage = true;
    }

    return callback(null, resultHolder);
};
