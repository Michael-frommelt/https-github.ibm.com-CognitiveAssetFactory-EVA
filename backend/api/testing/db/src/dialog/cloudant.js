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
    globalDatabase.connection.use(testFilesContainer).find({
        "selector": {
            "name": {
                $in: testCases
            }
        },
        "fields": [
            "name",
            "testCase"
        ]
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.docs);
        }
    });
};

exports.insertTestResults = function(testResults, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testResultContainer).bulk({"docs":testResults}, function(err, res) {
        if (err) {
            callbackError(500, err);
        } else {
            callbackSuccess(res);
        }
    });
};

exports.aggregateTestResults = function(timestamp, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testResultContainer).view("testing", "aggregateTestResults", {
        group: true,
        descending: true
    }, function(err, result) {
        if (err) {
            callbackError(500, err);
        } else {
            var resultArray = [];
            for (let entry of result.rows) {
                if (JSON.stringify(entry.key[0]) == JSON.stringify(timestamp)) {
                    resultArray.push({
                        "_id": entry.key[1],
                        "correctAnswerIdTrue": entry.value[0],
                        "correctAnswerIdFalse": entry.value[1],
                        "correctTopIntentTrue": entry.value[2],
                        "correctTopIntentFalse": entry.value[3],
                        "totalTestCases": entry.value[4]
                    });
                    break;
                }
            }
            if (result && resultArray.length == 0) {
                callbackError(500, "No results found for given timestamp.");
            } else {
                callbackSuccess(resultArray);
            }
        }

    });
};

exports.deleteTestrun = function(date, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testResultContainer).find({
        "selector": {
            "date": date
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            for (entry of result.docs) {
                entry._deleted = true;
            }
            globalDatabase.connection.use(testResultContainer).bulk({"docs": result.docs}, function(err) {
                if (err) {
                    return callbackError(500, err);
                }
                return callbackSuccess();
            });
        }
    });
};

exports.deleteTestSession = function(session_id, callbackSuccess, callbackError) {
    if (session_id !== undefined) {
        globalDatabase.connection.use(testSessionsContainer).find({
            "selector": {
                "session_id": session_id
            }
        }, function(err, result) {
            if (err) {
                return callbackError({
                    error: 'error_deleting_session',
                    session_id: session_id
                });
            }
            for (entry of result.docs) {
                entry._deleted = true;
            }
            globalDatabase.connection.use(testSessionsContainer).bulk({"docs": result.docs}, function(err) {
                if (err) {
                    return callbackError({
                        error: 'error_deleting_session',
                        session_id: session_id
                    });
                }
                return callbackSuccess();
            });
        });
    } else {
        globalDatabase.connection.use(testSessionsContainer).find({
            "selector": {}
        }, function(err, result) {
            if (err) {
                return callbackError({
                    error: 'error_deleting_session',
                    session_id: session_id
                });
            }
            for (entry of result.docs) {
                entry._deleted = true;
            }
            globalDatabase.connection.use(testSessionsContainer).bulk({"docs": result.docs}, function(err) {
                if (err) {
                    return callbackError({
                        error: 'error_deleting_session',
                        session_id: session_id
                    });
                }
                return callbackSuccess();
            });
        });
    }
};

exports.getTestSession = function(session_id, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testSessionsContainer).find({
        "selector": {
            "session_id": session_id
        }
    }, function(err, result) {
        if (err) {
            return callbackError('db_connection_error');
        }
        if (result.docs.length === 0) {
            return callbackSuccess({
                session_id: session_id,
                created: Date.now(),
                updated: Date.now(),
                session: {}
            });
        }
        return callbackSuccess(result.docs[0]);
    });
};

exports.saveTestSession = function(session_object, callbackSuccess, callbackError) {
    session_object.updated = Date.now();

    if (session_object._id == undefined) {
        globalDatabase.connection.use(testSessionsContainer).insert(session_object, function(err) {
            if (err) {
                return callbackError(500, err);
            } else {
                return callbackSuccess();
            }
        })
    } else {
        return globalDatabase.connection.use(testSessionsContainer).find({
            "selector": {
                "_id": session_object._id
            }
        }, function(err, findResult) {
          if(err) return callbackError(500, err);
            if (findResult.docs[0] != undefined) {
                session_object._rev = findResult.docs[0]._rev;
            }
            globalDatabase.connection.use(testSessionsContainer).insert(session_object, function(err) {
                if (err) {
                    return callbackError(500, err);
                } else {
                    return callbackSuccess();
                }
            })
        })
    }
};
