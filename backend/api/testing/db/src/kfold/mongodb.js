/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
const kfoldContainer = globalDatabase.config.containers.kfold;

exports.insertTestResults = function(kFoldResults, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(kfoldContainer).insert(kFoldResults, function(err, res) {
        if (err) {
            callbackError(500, err);
        } else {
            callbackSuccess(res);
        }
    });
};

exports.aggregateTestResults = function(date, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(kfoldContainer).aggregate([{
        $match: {
            date: date
        }
    }, {
        $unwind: {
            path: "$result",
            includeArrayIndex: 'k'
        }
    }, {
        $group: {
            _id: {
                k: "$k",
                result: "$result",
                date: "$date"
            }
        }
    }, {
        $unwind: "$_id.result"
    }, {
        $project: {
            k: "$_id.k",
            date: "$_id.date",
            intent: "$_id.result.intent",
            confidence: "$_id.result.confidence",
            successRatio: "$_id.result.successRatio",
            totalTestCases: "$_id.result.totalTestCases"
        }
    }, {
        $group: {
            _id: {
                intent: "$intent",
                date: "$date"
            },
            totalConfidenceAverage: {
                $avg: "$confidence"
            },
            totalSuccessRatioAverage: {
                $avg: "$successRatio"
            },
            totalTestCases: {
                $sum: "$_id.result.totalTestCases"
            }
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result && result.length == 0) {
            return callbackError(500, "No results found.");
        } else {
            return callbackSuccess(result);
        }
    });
}

exports.getTestResult = function(date, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(kfoldContainer).find({
        date: date,
        clientId: clientId
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result && result.length == 0) {
            return callbackError(500, "No results found.");
        } else {
            return callbackSuccess(result);
        }
    });
};

exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(kfoldContainer).aggregate([{
            $match: {
                clientId: clientId
            }
        }, {
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
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};
