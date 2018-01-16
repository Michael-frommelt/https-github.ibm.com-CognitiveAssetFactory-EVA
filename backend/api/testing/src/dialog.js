/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().DIALOG;
const permissions = require('../../../helper/permissions.js');
const uuidv4 = require('uuid/v4');
var clients = require('../../../helper/clients.js');
var service = require('../../../helper/conversation.js');
var moment = require('moment-timezone');
var async = require('async');
var pipeline = require('../../../pipeline/pipeline.js');
var chitchatConfig = require('../../../helper/config.js').getConfig('chitchat');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    // start a new dialog test run
    app.post('/api/testing/dialog/run', permissions.mwHasPermission('editTesting'), this.runTest);
    // get status of dialog test
    app.get('/api/testing/dialog/status', permissions.mwHasPermission('editTesting'), this.getStatus);
    // is dialog test running
    app.get('/api/testing/dialog/running', permissions.mwHasPermission('editTesting'), this.getRunning);
};


// ##############################
// ## API                      ##
// ##############################
var date = moment().tz("Europe/Berlin").format("YYYY/MM/DD HH:mm:ss");
var timestamp = new Date();

var testInProgress = false;
var watsonIsTraining = true;
var testCaseProgress = 0;

var testCasesOfRun = [];
var runName = [];

exports.runTest = function(req, res) {

    if (!testInProgress && req.url == "/api/testing/dialog/run") {
        var clientId = req.body.clientId;
        var testCases = req.body.testCases;

        if (clientId && testCases) {
            if(clients.isClientTechnical(clientId)) {
                return res.status(400).json("technical_client_admin_not_allowed");
            }

            testInProgress = true;
            date = moment().tz("Europe/Berlin").format("YYYY/MM/DD HH:mm:ss");
            timestamp = new Date();

            transferWorkspace(clientId, function(trainingFinished) {

                    watsonIsTraining = !trainingFinished;

                    db.getTestCases(testCases, function(result) {
                        resetVariables();

                        var testCases = [];
                        var testCase = null;
                        var id = null;

                        result.forEach(function(record) {
                            var index = 0;
                            record.testCase.forEach(function(step) {
                                if (step.id != id) {
                                    if (testCase) {
                                        testCases.push(testCase);
                                    }
                                    testCase = {
                                        id: step.id,
                                        steps: []
                                    };
                                    id = step.id;
                                    index = 0;
                                }
                                testCase.steps.push({
                                    input: step.input,
                                    answerId: step.answerId,
                                    intent: step.intent,
                                    test_file: record.name,
                                    id: step.id,
                                    index: index
                                });
                                index++;
                            });
                        });
                        if (testCase) {
                            testCases.push(testCase);
                        }

                        testCasesOfRun = testCases;
                        runName = req.body.testCases;

                        var testCasesDone = false;
                        var testStepsDone = false;

                        async.eachOfLimit(testCases, 5, function(currentCase, testCasesIndex, callbackCases) {
                            initiateConversation(clientId, function(sessionId) {
                                var testResult = [];
                                async.forEachSeries(currentCase.steps, function(currentStep, callback) {
                                    testCaseProgress++;
                                    evaluateTestStep(sessionId, clientId, currentCase, currentStep, function(result) {
                                        testResult.push(result);
                                        callback();
                                    }, function(err) {
                                        callback(err);
                                    });
                                }, function(err) {
                                    if (err) {
                                        callbackCases(err);
                                    } else {
                                        db.insertTestResults(testResult, function(result) {
                                            db.deleteTestSession(sessionId, function() {
                                                callbackCases();
                                            }, function(err) {
                                                callbackCases(err);
                                            });
                                        }, function(errCode, errReason) {
                                            callbackCases({
                                                errorCode: errorCode,
                                                errorReason: errorReason
                                            });
                                        });
                                    }
                                });
                            }, function(err) {
                                if (err) handleError("initial message failed", err);
                            });
                        }, function(err) {
                            handleResult("test failed", err);
                        });

                    }, function(errCode, errReason) {
                        handleResult("An error occurred in getTestCases", errReason);
                        return res.status(errCode).json(errReason);
                    });
                },
                function(errCode, errReason) {
                    handleError("An error occurred in transferWorkspace", errReason);
                    return;
                });

            res.status(200).send({
                testRunning: true,
                status: "started",
                testProgress: 0
            });

        } else {
            return res.status(400).json("Invalid parameters.");
        }

    } else {
        if (testInProgress) {
            if (watsonIsTraining) {
                res.status(200).send({
                    testRunning: true,
                    status: "watsonIsTraining",
                    testProgress: 0
                });
            } else {
                var stepsCount = 0;
                for (var i = 0; i < testCasesOfRun.length; i++) {
                    stepsCount += testCasesOfRun[i]['steps'].length;
                }
                var currentProgress = 0;
                if (stepsCount > 0) currentProgress = Math.floor((testCaseProgress / stepsCount) * 100);
                res.status(200).send({
                    testRunning: true,
                    status: "inProgress",
                    testProgress: currentProgress
                });
            }
        } else {
            db.aggregateTestResults(timestamp, function(result) {
                result.successRateTopIntent = (result.correctTopIntentTrue / result.totalTestCases).toFixed(2);
                result.successRateAnswerId = (result.correctAnswerIdTrue / result.totalTestCases).toFixed(2);

                res.status(200).send({
                    testRunning: false,
                    status: "finished",
                    testProgress: 100,
                    testResult: result
                });
            }, function(errCode, errReason) {
                res.status(errCode).send({
                    testRunning: false,
                    status: "failed",
                    testProgress: 100,
                    testResult: errReason
                });
            });
        }
    }
};

exports.getStatus = function(req, res) {
    exports.runTest(req, res);
};

exports.getRunning = function(req, res) {
    res.status(200).send({
        testInProgress: testInProgress
    });
};

exports.getVariables = function() {
    return {
        testCasesOfRun: testCases,
        runName: runName
    };
};

function evaluateTestStep(sessionId, clientId, currentCase, currentStep, callbackSuccess, callbackError) {

    startPipeline(currentStep.input, clientId, sessionId, function(sessionId, diff, output) {

        if (currentStep.intent != null || currentStep.answerId != null) {
            var test = {};
            test.correctTopIntent = (currentStep.intent.trim() == "INTENTLESS") || (currentStep.intent.trim() == output.topIntent);
            if (output && output.answer_id) {
                if (typeof output.answer_id === 'string') {
                    test.correctAnswerId = (currentStep.answerId.trim() == "") || (currentStep.answerId.trim() == output.answer_id);
                } else {
                    test.correctAnswerId = (output.answer_id.indexOf(currentStep.answerId.trim()) !== -1);
                }
            } else {
                test.correctAnswerId = null;
            }
            test.correct = test.correctTopIntent && test.correctAnswerId;
            test.id = currentCase.id;
            test.date = date;
            test.responseTime = diff;
            test.body = output;
            test.test = currentStep;
            test.runName = runName;
            test.clientId = clientId;
            test.counter = currentStep.index;
            test.timestamp = timestamp;
            callbackSuccess(test);

        } else {
            var err = {
                errCode: "error",
                errReason: "intent of current step is undefined"
            };
            callbackError(err);
        }

    }, function(err) {
        callbackError(err);
    });
}

function initiateConversation(clientId, callbackSuccess, callbackError) {
    startPipeline("", clientId, undefined, function(sessionId, diff, output) {
        if (output.isWelcome) {
            callbackSuccess(sessionId);
        } else {
            callbackError('output.isWelcome evaluates to undefined, null or false.');
        }
    }, function(err) {
        callbackError(err);
    });
}

function transferWorkspace(clientId, callbackSuccess, callbackError) {

    var sourceBusiness, targetBusiness;
    try {
        sourceBusiness = service.getBusinessConversationSetup(clientId);
    } catch (err) {
        callbackError(500, err);
    }

    try {
        targetBusiness = service.getTestingBusinessConversationSetup("dialog");
    } catch (err) {
        callbackError(500, err);
    }

    var sourceChitChat, targetChitChat;
    if (chitchatConfig && chitchatConfig.enabled) {
        try {
            sourceChitChat = service.getChitChatConversationSetup(clientId);
        } catch (err) {
            callbackError(500, err);
        }

        try {
            targetChitChat = service.getTestingChitChatConversationSetup("dialog");
        } catch (err) {
            callbackError(500, err);
        }
    }

    sourceBusiness.service.getWorkspace({
        workspace_id: sourceBusiness.workspace,
        export: true
    }, function(err, response) {
        if (err) {
            callbackError(500, err);
        } else {
            targetBusiness.service.updateWorkspace({
                workspace_id: targetBusiness.workspace,
                name: "TESTING_" + response.name,
                language: response.language,
                intents: response.intents,
                description: response.description,
                metadata: response.metadata,
                dialog_nodes: response.dialog_nodes,
                counterexamples: response.counterexamples,
                entities: response.entities
            }, function(err, response) {
                if (err) {
                    callbackError(500, err);
                } else {
                    if(sourceChitChat && targetChitChat) {
                        sourceChitChat.service.getWorkspace({
                            workspace_id: sourceChitChat.workspace,
                            export: true
                        }, function(err, response) {
                            if (err) {
                                callbackError(500, err);
                            } else {
                                targetChitChat.service.updateWorkspace({
                                    workspace_id: targetChitChat.workspace,
                                    name: "TESTING_" + response.name,
                                    language: response.language,
                                    intents: response.intents,
                                    description: response.description,
                                    metadata: response.metadata,
                                    dialog_nodes: response.dialog_nodes,
                                    counterexamples: response.counterexamples,
                                    entities: response.entities
                                }, function(err, response) {
                                    if (err) {
                                        callbackError(500, err);
                                    } else {
                                        setTimeout(function() {
                                            callbackSuccess(true);
                                        }, 180000);
                                    }
                                });
                            }
                        });
                    } else {
                        setTimeout(function() {
                            callbackSuccess(true);
                        }, 180000);
                    }
                }
            });
        }
    });
}

function startPipeline(inputText, client_id, session_id, callbackSuccess, callbackError) {
    var username = "testing";
    var text = inputText.toString();

    if (session_id === undefined || !session_id) {
        // if session_id not set, generate new session
        session_id = uuidv4();
    }

    if (client_id === undefined || !client_id) {
        return callbackError({
            error: 'client_id_missing'
        });
    }

    db.getTestSession(session_id, function(result) {
        var session = result;
        var session_object = session.session;
        var user = {};
        user.username = username;
        user.clients = [];
        user.clients.push(clients.findClientById(client_id));

        var inputObject = {};
        inputObject.session = session_object;
        inputObject.input = {
            text: text
        };
        inputObject.user = user;
        inputObject.clientId = client_id;
        inputObject.isTest = true;

        var time = Date.now();
        pipeline.callFromExternalFrontend(inputObject, function(err, output) {
            var diff = Date.now() - time;

            if (err) {
                console.log(inputObject.input);
                return callbackError(err);
            }

            if (!output) {
                output = {};
            }

            db.saveTestSession(session, function() {
                return callbackSuccess(session_id, diff, output);
            }, function(errCode, errMessage) {
                output.warning = "session_not_saved";
                output.session_error = errMessage;
                return callbackSuccess(session_id, diff, output);
            })
        });
    }, function(errReason) {
        return callbackError({
            error: 'internal_server_session_error'
        });
    });
};

function resetVariables() {
    testCasesOfRun = undefined;
    runName = undefined;
    runTimestamp = undefined;
}

function handleResult(msg, err) {
    if (typeof err === 'object' && err !== null) err = JSON.stringify(err);
    if (err) {
        console.log(msg + ": " + err);
        db.deleteTestrun(date, function() {
            console.log("results of failed test deleted from database");
        }, function(errCode, errReason) {
            console.log("results of failed test could not be deleted from database");
        });
    }
    testInProgress = false;
    watsonIsTraining = true;
    testCaseProgress = 0;
}

function handleError(msg, err) {
    return handleResult(msg, err);
}
