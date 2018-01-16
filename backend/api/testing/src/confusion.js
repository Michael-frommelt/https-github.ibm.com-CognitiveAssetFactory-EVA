/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().CONFUSION;
const permissions = require('../../../helper/permissions.js');
var service = require('../../../helper/conversation.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    // get required and found intent for all tests for confusion matrix
    app.post('/api/testing/confusion/getTestIntents', permissions.mwHasPermission('editTesting'), this.getTestIntents);
    // get times for all tests for confusion matrix
    app.post('/api/testing/confusion/getTestTimes', permissions.mwHasPermission('editTesting'), this.getTestTimes);
    // get intents from database
    app.post('/api/testing/confusion/getTrainingIntents', permissions.mwHasPermission('editTesting'), this.getTrainingIntents);
};

// ##############################
// ## API                      ##
// ##############################

exports.getTestIntents = function(req, res) {

    var time = req.body.time;
    var clientId = req.body.clientId;

    if (time && clientId) {
        db.getIntentsForTests(time, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getTestIntents: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestTimes = function(req, res) {
    var clientId = req.body.clientId;

    if (clientId) {
        db.getTestTimes(clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getTestTimes: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTrainingIntents = function(req, res) {
    var clientId = req.body.clientId;

    if (clientId) {
        var source;
        try {
            source = service.getBusinessConversationSetup(clientId);
        } catch (err) {
            callbackError(500, err);
        }

        source.service.getIntents({
            workspace_id: source.workspace,
            export: true
        }, function(error, result) {
            if (error) {
                console.log("Error retrieving intents for business workspace!");
                console.log(error);
                return res.status(500).json(error);
            } else {
                var response = [];

                for (var i = 0; i < result.intents.length; i++) {
                    response.push({
                        intent: result.intents[i].intent,
                        count: result.intents[i].examples.length
                    });
                }

                res.status(200).send(response.sort(function(a, b) {
                    return b.count - a.count;
                }));
            }
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};
