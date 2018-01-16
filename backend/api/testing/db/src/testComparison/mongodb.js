/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var ObjectID = require('mongodb').ObjectID;

const testResultContainer = globalDatabase.config.containers.test_results;

exports.getTestRuns = function(clientId) {
    return globalDatabase.connection.collection(testResultContainer).distinct('timestamp', {
        clientId: clientId
    });
};

// compare two test cases with each other
exports.getTestComparison = function(baseRunDate, compareRunDate, clientId) {
    return globalDatabase.connection.collection(testResultContainer).aggregate([{
            $match: {
                $or: [{
                        'timestamp': baseRunDate
                    },
                    {
                        'timestamp': compareRunDate
                    },
                ],
                clientId: clientId
            }
        },
        {
            $group: {
                '_id': {
                    'id': '$id',
                    'counter': '$counter'
                },
                'result': {
                    $addToSet: '$correct'
                },
                'step': {
                    $first: '$counter'
                },
                'test': {
                    $addToSet: '$test'
                },
                'timestamps': {
                    $push: '$timestamp'
                },
                'resultId': {
                    $push: '$_id'
                },
            }
        },
        {
            $match: {
                'result.1': {
                    $exists: true
                }
            }
        },
    ]).toArray();
};

exports.getTestResult = function(resultId, clientId) {
    return globalDatabase.connection.collection(testResultContainer).findOne({
        '_id': new ObjectID(resultId),
        clientId: clientId
    });
}
