/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().KFOLD;
const permissions = require('../../../helper/permissions.js');
var async = require('async');
var moment = require('moment-timezone');
var service = require('../../../helper/conversation.js');
var chitchatConfig = require('../../../helper/config.js').getConfig('chitchat');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    // start k-fold test
    app.post('/api/testing/kfold/run', permissions.mwHasPermission('editTesting'), this.runTest);
    // get status for current k-fold test
    app.post('/api/testing/kfold/status', permissions.mwHasPermission('editTesting'), this.getStatus);
    // get result for specified k-fold test
    app.post('/api/testing/kfold/result', permissions.mwHasPermission('editTesting'), this.getResult);
    // get all intents for k-fold test
    app.post('/api/testing/kfold/intents', permissions.mwHasPermission('editTesting'), this.getIntents);
    // get times for all tests for k-fold test
    app.post('/api/testing/kfold/times', permissions.mwHasPermission('editTesting'), this.getTestTimes);
    // is k-fold test running
    app.get('/api/testing/kfold/running', permissions.mwHasPermission('editTesting'), this.getRunning);
};

// ##############################
// ## API                      ##
// ##############################
var testInProgress = false;
var watsonIsTraining = true;
var currentTestCase = 0;
var totalLength = 0;
var date = null;
var timestamp = null;

exports.runTest = function(req, res) {

    if (!testInProgress && req.url == "/api/testing/kfold/run") {
        testInProgress = true;

        date = moment().tz("Europe/Berlin").format("YYYY/MM/DD HH:mm:ss");
        timestamp = new Date();

        var k = req.body.k;
        var clientId = req.body.clientId;

        if (k && clientId) {
            var target = service.getTestingBusinessConversationSetup("kfold");

            getTrainingData(clientId, function(result) {
                totalLength = calculateTotalLength(result);

                var frequencyPerIntent = calculateFrequency(result);

                var chunkArray = [];

                result.forEach(function(intent) {
                    chunkArray.push({
                        intent: intent.intent,
                        examples: splitArrayInChunks(intent, k)
                    });
                });

                var kfoldArray = [];

                for (var i = 0; i < k; i++) {
                    var kfoldObject = [];

                    chunkArray.forEach(function(intent) {
                        kfoldObject.push({
                            training: {
                                intent: intent.intent,
                                examples: concatTrainingData(intent.examples, i)
                            },
                            test: {
                                intent: intent.intent,
                                examples: intent.examples[i]
                            }
                        });
                    });

                    kfoldArray.push(kfoldObject);
                }

                var result = [];

                var counter = 1;

                async.forEachSeries(kfoldArray, function(kfoldObject, callback) {
                    var trainingData = [];

                    kfoldObject.forEach(function(intent) {
                        trainingData.push(intent.training);
                    });

                    watsonIsTraining = true;

                    trainWorkspace(trainingData, function(trainingFinished) {
                        watsonIsTraining = !trainingFinished;

                        var resultPerTraining = [];

                        async.forEachSeries(kfoldObject, function(intent, callback) {

                            var resultPerIntent = {
                                intent: intent.test.intent,
                                confidence: 0.0,
                                successRatio: 0.0,
                                totalTestCases: 0,
                                examples: []
                            };

                            async.forEachSeries(intent.test.examples, function(example, callback) {
                                currentTestCase++;

                                var payload = {
                                    workspace_id: target.workspace,
                                    input: example,
                                    alternate_intents: true
                                };

                                target.service.message(payload, function(err, data) {
                                    if (err) {
                                        console.log("KFold Test Message Error first try failed", err);
                                        target.service.message(payload, function(err, data) {
                                            if (err) {
                                                console.log("KFold Test Message Error second try failed", err);
                                                callback(err);
                                            } else {
                                                console.log("KFold Test Message Error second try successfull", err);
                                                resultPerIntent= processResult(data, intent, example, resultPerIntent);
                                                callback();
                                            }
                                        });
                                    } else {
                                        resultPerIntent= processResult(data, intent, example, resultPerIntent);
                                        callback();
                                    }
                                });
                            }, function(err) {
                                if (err) {
                                    callback({
                                        errCode: 500,
                                        errReason: err
                                    });
                                } else {
                                    resultPerIntent.confidence = calculateAverageConfidence(resultPerIntent);
                                    resultPerIntent.successRatio = calculateSuccessRatio(resultPerIntent);
                                    resultPerIntent.totalTestCases = calculateTotalTestCases(resultPerIntent);
                                    resultPerTraining.push(resultPerIntent);
                                    callback();
                                }
                            });

                        }, function(err) {
                            if (err) {
                                callback({
                                    errCode: err.errCode,
                                    errReason: err.errReason
                                });
                            } else {
                                result.push(resultPerTraining);
                                callback();
                            }
                        });

                    }, function(errCode, errReason) {
                        callback({
                            errCode: errCode,
                            errReason: errReason
                        });
                    });

                }, function(err) {
                    if (err) {
                        watsonIsTraining = true;
                        testInProgress = false;
                        currentTestCase = 0;
                        totalLength = 0;
                        console.log(err);
                    } else {
                        db.insertTestResults({
                            date: date,
                            timestamp: timestamp,
                            clientId: clientId,
                            frequency: frequencyPerIntent,
                            result: result
                        }, function() {
                            watsonIsTraining = true;
                            testInProgress = false;
                            currentTestCase = 0;
                            totalLength = 0;
                        }, function(errCode, errReason) {
                            watsonIsTraining = true;
                            testInProgress = false;
                            currentTestCase = 0;
                            totalLength = 0;
                            console.log({
                                errCode: errCode,
                                errReason: errReason
                            });
                        });
                    }
                });

            }, function(errCode, errReason) {
                console.log("An error occurred in getTrainingData: " + errReason);
                return res.status(errCode).json(errReason);
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

        var currentProgress = 0;
        if (totalLength > 0) currentProgress = Math.floor((currentTestCase / totalLength) * 100);

        if (testInProgress) {
            if (watsonIsTraining) {
                res.status(200).send({
                    testRunning: true,
                    status: "watsonIsTraining",
                    testProgress: currentProgress
                });
            } else {
                res.status(200).send({
                    testRunning: true,
                    status: "inProgress",
                    testProgress: currentProgress
                });
            }
        } else {
            db.aggregateTestResults(date || req.body.date, function(result) {
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

exports.getResult = function(req, res) {
    var date = req.body.date;
    var clientId = req.body.clientId;

    if (date && clientId) {
        db.getTestResult(date, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getIntents = function(req, res) {

    var clientId = req.body.clientId;

    if (clientId) {
        var source;
        try {
            source = service.getBusinessConversationSetup(clientId);
        } catch (err) {
            callbackError(500, err);
        }

        source.service.getIntents({
            workspace_id: source.workspace
        }, function(error, result) {
            if (error) {
                return res.status(500).json(error);
            } else {
                res.status(200).send(result);
            }
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestTimes = function(req, res) {
    if (req.body.clientId) {
        db.getTestTimes(req.body.clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getTestTimes: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getRunning = function(req, res) {
    res.status(200).send({
        testInProgress: testInProgress
    });
};

function getTrainingData(clientId, callbackSuccess, callbackError) {
    var source;
    try {
        source = service.getBusinessConversationSetup(clientId);
    } catch (err) {
        callbackError(500, err);
    }

    source.service.getWorkspace({
        workspace_id: source.workspace,
        export: true
    }, function(err, response) {
        if (err) {
            console.log(err);
            callbackError(500, err);
        } else {
            callbackSuccess(response.intents);
        }
    });
}

function splitArrayInChunks(intent, k) {
    var length = intent.examples.length;

    var bigChunksTotal = length % k;
    var smallChunksTotal = k - bigChunksTotal;

    var bigChunksSize = Math.ceil(length / k);
    var smallChunksSize = Math.floor(length / k);

    var array = intent.examples;
    var chunkArray = [];

    while (bigChunksTotal > 0) {
        var temp = [];
        var i = bigChunksSize;
        while (i > 0) {
            if (array.length > 0) {
                var randomIndex = Math.floor(Math.random() * array.length);
                temp.push({
                    text: array[randomIndex].text
                });
                array.splice(randomIndex, 1);
                i--;
            }
        }
        chunkArray.push(temp);
        bigChunksTotal--;
    }

    while (smallChunksTotal > 0) {
        var temp = [];
        var i = smallChunksSize;
        while (i > 0) {
            if (array.length > 0) {
                var randomIndex = Math.floor(Math.random() * array.length);
                temp.push({
                    text: array[randomIndex].text
                });
                array.splice(randomIndex, 1);
                i--;
            }
        }
        chunkArray.push(temp);
        smallChunksTotal--;
    }

    return chunkArray;
}

function concatTrainingData(examples, i) {
    var concatenatedTrainingExamples = [];

    for (var j = 0; j < examples.length; j++) {
        if (i != j) {
            concatenatedTrainingExamples = concatenatedTrainingExamples.concat(examples[j]);
        }
    }

    return concatenatedTrainingExamples;
}

function trainWorkspace(trainingData, callbackSuccess, callbackError) {

    var target;
    try {
        target = service.getTestingBusinessConversationSetup("kfold");
    } catch (err) {
        callbackError(500, err);
    }

    target.service.updateWorkspace({
        workspace_id: target.workspace,
        name: "k-fold cross validation",
        language: "de",
        description: "test workspace for k-fold cross validation",
        intents: trainingData,
        dialog_nodes: [],
        entities: []
    }, function(err, response) {
        if (err) {
            console.log(err);
            callbackError(500, err);
        } else {
            setTimeout(function() {
                callbackSuccess(true);
            }, 180000);
        }
    });
}

function calculateAverageConfidence(resultPerIntent) {
    var length = resultPerIntent.examples.length;
    var sum = 0.0;

    resultPerIntent.examples.forEach(function(result) {
        sum += result.confidence;
    });

    return (sum / length);
}

function calculateSuccessRatio(resultPerIntent) {
    var length = resultPerIntent.examples.length;
    var sum = 0;

    resultPerIntent.examples.forEach(function(result) {
        if (result.correctIntent) sum++;
    });

    return (sum / length);
}

function calculateTotalTestCases(resultPerIntent) {
    return resultPerIntent.examples.length;
}

function calculateTotalLength(result) {
    var counter = 0;

    result.forEach(function(intent) {
        counter += intent.examples.length;
    });

    return counter;
}

function calculateFrequency(result) {
    var frequencyPerIntent = [];

    result.forEach(function(intent) {
        frequencyPerIntent.push({
            intent: intent.intent,
            frequency: intent.examples.length
        });
    });

    return frequencyPerIntent;
};


function processResult(data, intent, example, resultPerIntent){
  if (data.intents[0] && intent.test.intent === data.intents[0].intent) {
      if ((chitchatConfig && chitchatConfig.enabled && data.intents[0].confidence > chitchatConfig.reassurance_confidence_level) || (chitchatConfig && !chitchatConfig.enabled) || !chitchatConfig) {
          resultPerIntent.examples.push({
              correctIntent: true,
              confidence: data.intents[0].confidence,
              input: example.text
          });
      } else {
          resultPerIntent.examples.push({
              correctIntent: false,
              confidence: data.intents[0].confidence,
              input: example.text
          });
      }
  } else {
      var intent_array = [];
      for (var i = 0; i < data.intents.length; i++) {
          intent_array.push(data.intents[i].intent);
      }
      var intentIndex = intent_array.indexOf(intent.test.intent);
      if (intentIndex != -1) {
          resultPerIntent.examples.push({
              correctIntent: false,
              classifiedIntent: data.intents[0] ? data.intents[0].intent : null,
              confidence: data.intents[intentIndex] ? data.intents[intentIndex].confidence : null,
              input: example.text
          });
      } else {
          resultPerIntent.examples.push({
              correctIntent: false,
              classifiedIntent: data.intents[0] ? data.intents[0].intent : null,
              confidence: 0.0,
              input: example.text
          });
      }
  }
  return resultPerIntent;
}
