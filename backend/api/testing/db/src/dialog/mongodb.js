/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const testFilesContainer = globalDatabase.config.containers.test_files;
const testResultContainer = globalDatabase.config.containers.test_results;
const testSessionsContainer = globalDatabase.config.containers.test_sessions;

exports.getTestCases = function(testCases, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).aggregate([{
        $match: {
            name: {
                $in: testCases
            }
        }
    }, {
        $project: {
            _id: 0,
            name: 1,
            testCase: 1
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result);
        }
    });
};

exports.insertTestResults = function(testResults, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).insert(testResults, function(err, res) {
        if (err) {
            callbackError(500, err);
        } else {
            callbackSuccess(res);
        }
    });
};

exports.aggregateTestResults = function(timestamp, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
            $match: {
                "timestamp": timestamp
            }
        },
        {
            $group: {
                _id: "$date",
                correctAnswerIdTrue: {
                    "$sum": {
                        "$cond": ["$correctAnswerId", 1, 0]
                    }
                },
                correctAnswerIdFalse: {
                    "$sum": {
                        "$cond": ["$correctAnswerId", 0, 1]
                    }
                },
                correctTopIntentTrue: {
                    "$sum": {
                        "$cond": ["$correctTopIntent", 1, 0]
                    }
                },
                correctTopIntentFalse: {
                    "$sum": {
                        "$cond": ["$correctTopIntent", 0, 1]
                    }
                },
                totalTestCases: {
                    $sum: 1
                }
            }
        }, {
            $sort: {
                _id: -1
            }
        }, {
            $limit: 1
        }
    ]).toArray(function(err, res) {
        if (err) {
            callbackError(500, err);
        } else if (res && res.length == 0) {
            callbackError(500, "No results found for given timestamp.")
        } else {
            callbackSuccess(res[0]);
        }
    });
};

exports.deleteTestrun = function(date, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).remove({
        date: date
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess();
        }
    });
};

exports.deleteTestSession = function(session_id, callbackSuccess, callbackError) {
    var callback = function(err, result) {
        if (err) {
            return callbackError({
                error: 'error_deleting_session',
                session_id: 'session_id'
            });
        }

        return callbackSuccess();
    };

    if (session_id !== undefined) {
        globalDatabase.connection.collection(testSessionsContainer).remove({
            session_id: session_id
        }, callback);
    } else {
        globalDatabase.connection.collection(testSessionsContainer).remove({}, callback);
    }
};

exports.getTestSession = function(session_id, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testSessionsContainer).find({
        session_id: session_id
    }).toArray(function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.length === 0) {
            return callbackSuccess({
                session_id: session_id,
                created: Date.now(),
                updated: Date.now(),
                session: {}
            });
        }

        return callbackSuccess(result[0]);
    });
};

exports.saveTestSession = function(session_object, callbackSuccess, callbackError) {
    session_object.updated = Date.now();

    globalDatabase.connection.collection(testSessionsContainer).save(session_object, function(err) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess();
        }
    });
};
