/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const testFilesContainer = globalDatabase.config.containers.test_files;

exports.getTestCase = function(name, clientId, callbackSuccess, callbackError) {
    return globalDatabase.connection.use(testFilesContainer).find({
        "selector": {
            name: name,
            clientId: clientId
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result && result.length == 0) {
            return callbackError(500, "No results found.");
        } else {
            callbackSuccess(result.docs);
        }
    });
};

exports.updateTestCase = function(name, clientId, testCase, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testFilesContainer).find({
        "selector": {
            name: name,
            clientId: clientId
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        result.docs[0].testCase = testCase;
        return globalDatabase.connection.use(testFilesContainer).insert(result.docs[0], function(err, body, header) {
            if (err) {
                return callbackError(500, err);
            } else {
                return callbackSuccess(body);
            }
        });

    });
};

exports.deleteTestCase = function(name, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testFilesContainer).find({
        "selector": {
            name: name,
            clientId: clientId
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return globalDatabase.connection.use(testFilesContainer).destroy(result.docs[0]._id, result.docs[0]._rev, function(err, body, header) {
                if (err) {
                    return callbackError(500, err);
                } else {
                    return callbackSuccess(body);
                }
            })
        }
    });
};

exports.createTestCase = function(name, clientId, testCase, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testFilesContainer).insert({
            name: name,
            clientId: clientId,
            testCase: testCase
        }, function(err, result) {
            if (err) {
                return callbackError(500, err);
            } else {
                return callbackSuccess(result);
            }
        });
}

exports.checkUniqueness = function(name, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.use(testFilesContainer).find({
        "selector": {
            name: name,
            clientId: clientId
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.docs.length > 0) {
            return callbackSuccess(true);
        }
        return callbackSuccess(false);
    });
};
