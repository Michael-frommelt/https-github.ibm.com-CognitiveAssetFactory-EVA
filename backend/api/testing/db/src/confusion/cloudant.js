/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const testResultContainer = globalDatabase.config.containers.test_results;
const view_result_testing = globalDatabase.config.containers.view_result_testing;

//List all intents for all tests
exports.getIntentsForTests = function(time, clientId, callbackSuccess, callbackError) {
    if (typeof time === 'object') {
        time = time._id;
    }
    globalDatabase.connection.use(testResultContainer).view("testing", "getIntentsForTests", {
            group: true,
        }, function(err, result) {
            if (err) {
                return callbackError(500, err);
            }
            var resultOverview = [];
            for (let entry of result.rows) {
                if (time) {
                    if (entry.key[0] == clientId && entry.key[4] == time) {
                        if (!resultOverview[entry.key[1]]) {
                            resultOverview[entry.key[1]] = [];
                        }
                        resultOverview[entry.key[1]].push({
                            "givenIntent": entry.key[2],
                            "count": entry.value
                        });
                    }
                }
            }

            globalDatabase.connection.use(view_result_testing).view("chainedQueries", "getIntentsForTests_chained", {
                    group: true,
                }, function(err, result) {
                    if (err) {
                        return callbackError(500, err);
                    }
                    var resultArray = [];
                    for (let entry of result.rows) {
                        if (time) {
                            if (entry.key[0] == clientId && entry.key[2] == time) {
                                for (key in resultOverview) {
                                    if(key.localeCompare(entry.key[1]) === 0) {
                                        resultArray.push({
                                            "_id": key,
                                            "count": entry.value,
                                            "result": resultOverview[key]
                                        });
                                    }
                                }
                            }
                        }
                    }
                    return callbackSuccess(resultArray);

            });
    });
};

//List all testTimes
exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
    var timestamp = new Date(new Date().setDate(new Date().getDate() - 50));
    var date = (timestamp.getFullYear() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getDate() + " " + (timestamp.getHours() - 1) + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds());
    globalDatabase.connection.use(testResultContainer).view("testing", "getTestTimes", {
        group: true,
        descending: true,
        endkey: [date, timestamp, clientId]
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        var resultArray = [];
        for (let entry of result.rows) {
            resultArray.push({
                "_id": entry.key[0],
                "count": entry.value
            });
        }
        return callbackSuccess(resultArray);
    });
};
