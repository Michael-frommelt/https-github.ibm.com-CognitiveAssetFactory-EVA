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
const testFilesContainer = globalDatabase.config.containers.test_files;

// get test results aggregated by test case
exports.getTestcasePerformance = function(run, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
        $match: {
            clientId: clientId
        }
    }, {
        $group: {
            _id: {
                "date": "$date",
                "id": "$id"
            },
            correct: {
                $push: {
                    $cond: ["$correctAnswerId", 1, 0]
                }
            }
        }
    }, {
        $project: {
            "_id": "$_id",
            "date": "$_id.date",
            "id": "$_id.id",
            "correct": {
                $min: "$correct"
            }
        }
    }, {
        $group: {
            _id: {
                "date": "$date"
            },
            count: {
                $sum: 1
            },
            passed: {
                $sum: "$correct"
            },
            ratio: {
                $avg: "$correct"
            }
        }
    }, {
        $sort: {
            "_id": 1
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// get test results aggregated by test steps
exports.getTeststepPerformance = function(run, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
            $match: {
                clientId: clientId
            }
        }, {
            $group: {
                _id: {
                    "date": "$date",
                    "id": "$id",
                    "counter": "$counter"
                },
                correct: {
                    $first: {
                        $cond: ["$correct", 1, 0]
                    }
                }
            }
        }, {
            $project: {
                "_id": "$_id",
                "date": "$_id.date",
                "id": "$_id.id",
                "correct": "$correct"
            }
        }, {
            $group: {
                _id: {
                    "date": "$date"
                },
                count: {
                    $sum: 1
                },
                passed: {
                    $sum: "$correct"
                },
                ratio: {
                    $avg: "$correct"
                }
            }
        }, {
            $sort: {
                "_id": -1
            }
        }]).toArray(function(err, result) {
            if (err) {
                return callbackError(500, err);
            }
            return callbackSuccess(result);
        });
};

exports.getTestResultByFile = function(run, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
        $match: {
            timestamp: {
                $gte: new Date(run)
            },
            clientId: clientId
        }
    }, {
        $project: {
            date: "$date",
            test_file: "$test.test_file",
            id: "$id",
            input: "$test.input",
            counter: "$counter",
            confidence: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, "$body.confidence" , 0]
            },
            correctAnswerId: {
                "$cond": [{
                    $eq: ["$correctAnswerId", true]
                }, 1, 0]
            },
            correctIntent: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, 1, 0]
            }
        }
    }, {
        $group: {
            _id: {
                test_file: "$test_file",
                date: "$date"
            },
            avgConfidence: {
                "$avg": "$confidence"
            },
            numCorrectId: {
                "$sum": "$correctAnswerId"
            },
            numCorrectIntent: {
                "$sum": "$correctIntent"
            },
            testTotal: {
                $sum: 1
            }
        }
    }, {
        $sort: {
            "_id.date": -1
        }
    }, {
        $group: {
            _id: "$_id.test_file",
            resultPerDate: {
                $push: {
                    date: "$_id.date",
                    avgConfidence: "$avgConfidence",
                    numCorrectAnswerId: "$numCorrectId",
                    numCorrectIntent: "$numCorrectIntent",
                    testTotal: "$testTotal"
                }
            }
        }
    }, {
        $sort: {
            _id: 1
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
}

exports.getTestResultByIntent = function(run, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
        $match: {
            timestamp: {
                $gte: new Date(run)
            },
            clientId: clientId
        }
    }, {
        $project: {
            date: "$date",
            intent: "$test.intent",
            id: "$id",
            input: "$test.input",
            counter: "$counter",
            confidence: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, "$body.confidence" , 0]
            },
            correctAnswerId: {
                "$cond": [{
                    $eq: ["$correctAnswerId", true]
                }, 1, 0]
            },
            correctIntent: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, 1, 0]
            }
        }
    }, {
        $group: {
            _id: {
                intent: "$intent",
                date: "$date"
            },
            avgConfidence: {
                "$avg": "$confidence"
            },
            numCorrectId: {
                "$sum": "$correctAnswerId"
            },
            numCorrectIntent: {
                "$sum": "$correctIntent"
            },
            testTotal: {
                $sum: 1
            }
        }
    }, {
        $sort: {
            "_id.date": -1
        }
    }, {
        $group: {
            _id: "$_id.intent",
            resultPerDate: {
                $push: {
                    date: "$_id.date",
                    avgConfidence: "$avgConfidence",
                    numCorrectAnswerId: "$numCorrectId",
                    numCorrectIntent: "$numCorrectIntent",
                    testTotal: "$testTotal"
                }
            }
        }
    }, {
        $sort: {
            _id: 1
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
}

exports.getTestResultInDetail = function(run, key, value, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
        $match: {
            timestamp: {
                $gte: new Date(run)
            },
            ['test.' + key]: value,
            clientId: clientId,
            id: {
                $nin: ["", null, undefined]
            }
        }
    }, {
        $project: {
            date: "$date",
            uuid: "$id",
            intent: "$test.intent",
            answerId: "$test.answerId",
            input: "$test.input",
            counter: "$counter",
            confidence: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, "$body.confidence" , 0]
            },
            correctAnswerId: {
                "$cond": [{
                    $eq: ["$correctAnswerId", true]
                }, 1, 0]
            },
            correctIntent: {
                "$cond": [{
                    $eq: ["$correctTopIntent", true]
                }, 1, 0]
            }
        }
    }, {
        $group: {
            _id: {
                uuid: "$uuid",
                input: "$input",
                counter: "$counter"
            },
            dateResult: {
                $push: {
                    date: "$date",
                    confidence: "$confidence",
                    correctAnswerId: "$correctAnswerId",
                    correctIntent: "$correctIntent"
                }
            },
            inputResult: {
                $push: {
                    counter: "$counter",
                    intent: "$intent",
                    answerId: "$answerId"
                }
            }
        }
    }, {
        $group: {
            _id: "$_id.uuid",
            uuidResult: {
                $push: {
                    input: "$_id.input",
                    counter: {
                        $arrayElemAt: ["$inputResult.counter", 0]
                    },
                    intent: {
                        $arrayElemAt: ["$inputResult.intent", 0]
                    },
                    answerId: {
                        $arrayElemAt: ["$inputResult.answerId", 0]
                    },
                    inputResult: "$dateResult"
                }
            }
        }
    }, {
        $unwind: "$uuidResult"
    }, {
        $sort: {
            "uuidResult.counter": 1
        }
    }, {
        $group: {
            _id: "$_id",
            uuidResult: {
                $push: "$uuidResult"
            }
        }
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
}

//List all testTimes
exports.getRun = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).aggregate([{
            $match: {
                clientId: clientId
            }
        },
        {
            $group: {
                "_id": {
                    "timestamp": "$timestamp",
                    "date": "$date"
                }
            }
        },
        {
            $sort: {
                "_id.timestamp": -1
            }
        },
        {
            $limit: 5
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

//List names of test files
exports.getFileNames = function(clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).aggregate([{
            $match: {
                clientId: clientId
            }
        },
        {
            $project: {
                name: "$name"
            }
        },
        {
            $sort: {
                name: 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

exports.deleteTestrun = function(date, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testResultContainer).remove({
        date: date,
        clientId: clientId
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess();
        }
    });
};
