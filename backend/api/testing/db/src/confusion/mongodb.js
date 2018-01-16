/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const testResultContainer = globalDatabase.config.containers.test_results;

//List all intents for all tests
exports.getIntentsForTests = function(time, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{

            $match: {
                date: time,
                clientId: clientId
            }
        }, {
            $project: {
                confidence: "$body.confidence",
                requiredIntent: "$test.intent",
                givenIntent: "$body.topIntent"
            }
        }, {
            $match: {
                requiredIntent: {
                    $nin: ["INTENTLESS", "", "ABC", "abc"]
                }
            }
        },
        {
            $group: {
                _id: {
                    requiredIntent: "$requiredIntent",
                    givenIntent: "$givenIntent"
                },
                count: {
                    $sum: 1
                },
            }
        },
        {
            $group: {
                _id: "$_id.requiredIntent",

                result: {
                    $push: {
                        givenIntent: "$_id.givenIntent",
                        count: "$count",
                    }
                },
                count: {
                    $sum: "$count"
                }
            }
        }
    ], (function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    }));
};

//List all testTimes
exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([

        {
            $match: {
                timestamp: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 50))
                },
                clientId: clientId
            }
        },
        {
            $group: {
                _id: "$date",
                count: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                "_id": -1
            }
        }
    ], (function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    }));
};
