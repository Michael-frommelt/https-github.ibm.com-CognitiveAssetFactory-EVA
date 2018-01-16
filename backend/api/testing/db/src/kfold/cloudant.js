/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const kfoldContainer = globalDatabase.config.containers.kfold;

exports.insertTestResults = function(kFoldResults, callbackSuccess, callbackError) {
    globalDatabase.connection.use(kfoldContainer).bulk({docs: [kFoldResults]}, function(err, res) {
        if (err) {
            callbackError(500, err);
        } else {
            callbackSuccess(res);
        }
    });
};

exports.aggregateTestResults = function(date, callbackSuccess, callbackError) {
    globalDatabase.connection.use(kfoldContainer).view("testing", "aggregateTestResults", {
        group: true
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        };
        var resultArray = [];
        for (let entry of result.rows) {
            if(entry.key[0] == date) {
            resultArray.push({
                "_id": {
                    "intent": entry.key[1],
                    "date": entry.key[0]
                },
                "totalConfidenceAverage": entry.value[0]/entry.value[3],
                "totalSuccessRatioAverage": entry.value[1]/entry.value[3],
                "totalTestCases": entry.value[2]
            });
            }
        }
        if (result && resultArray.length == 0) {
            return callbackError(500, "No results found.");
        }
        return callbackSuccess(resultArray);
    })
}

exports.getTestResult = function(date, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.use(kfoldContainer).find({
        "selector": {
            date: date,
            clientId: clientId
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result && result.docs.length == 0) {
            return callbackError(500, "No results found.");
        } else {
            return callbackSuccess(result.docs);
        }
    });
};

exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.use(kfoldContainer).view("testing", "getTestTimes", {
        group: true,
        descending: true,
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        var resultArray = [];
        for (let entry of result.rows) {
            if (entry.key[0] = clientId) {
                resultArray.push({
                    "_id": entry.key[1],
                    "count": entry.value
                });
            }
        }
        return callbackSuccess(resultArray);
    });
};
