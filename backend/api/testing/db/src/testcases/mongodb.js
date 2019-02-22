/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
const testFilesContainer = globalDatabase.config.containers.test_files;

exports.getTestCase = function(name, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).find({
        name: name,
        clientId: clientId
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result && result.length == 0) {
            return callbackError(500, "No results found.");
        } else {
            callbackSuccess(result);
        }
    });
};

exports.updateTestCase = function(name, clientId, testCase, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).updateOne({
        name: name,
        clientId: clientId
    }, {
        '$set': {
            testCase: testCase
        }
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
};

exports.deleteTestCase = function(name, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).deleteOne({
        name: name,
        clientId: clientId
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
};

exports.createTestCase = function(name, clientId, testCase, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).save({
        name: name,
        clientId: clientId,
        testCase: testCase
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result.result);
        }
    });
}

exports.checkUniqueness = function(name, clientId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(testFilesContainer).find({
        name: name,
        clientId: clientId
    }).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else if (result.length > 0) {
            return callbackSuccess(true);
        }
        return callbackSuccess(false);
    });
};
