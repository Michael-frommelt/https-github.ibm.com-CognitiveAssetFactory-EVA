/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

//List all testTimes
exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([
        {
            $match: {
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
        },
        {
            $limit: 50
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};
