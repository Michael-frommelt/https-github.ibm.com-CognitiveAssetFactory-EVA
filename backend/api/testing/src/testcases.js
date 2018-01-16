/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().TESTCASES;
const permissions = require('../../../helper/permissions.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    app.post('/api/testing/testcases/get', permissions.mwHasPermission('editTesting'), this.getTestCase);
    app.post('/api/testing/testcases/update', permissions.mwHasPermission('editTesting'), this.updateTestCase);
    app.post('/api/testing/testcases/delete', permissions.mwHasPermission('editTesting'), this.deleteTestCase);
    app.post('/api/testing/testcases/create', permissions.mwHasPermission('editTesting'), this.createTestCase);
};


// ##############################
// ## API                      ##
// ##############################

exports.getTestCase = function(req, res) {
    var name = req.body.name;
    var clientId = req.body.clientId;

    if (name && clientId) {
        db.getTestCase(name, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json('Invalid parameters.');
    }
};

exports.updateTestCase = function(req, res) {
    var name = req.body.name;
    var clientId = req.body.clientId;
    var testCase = req.body.testcases;

    if (name && clientId && testCase) {
        db.updateTestCase(name, clientId, testCase, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json('Invalid parameters.');
    }
};

exports.deleteTestCase = function(req, res) {
    var name = req.body.name;
    var clientId = req.body.clientId;

    if (name && clientId) {
        db.deleteTestCase(name, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json('Invalid parameters.');
    }
};

exports.createTestCase = function(req, res) {
    var name = req.body.name;
    var clientId = req.body.clientId;
    var testCase = req.body.testcases;

    if (name && clientId && testCase) {
        db.checkUniqueness(name, clientId, function(testCaseExists) {
            if (testCaseExists) {
                return res.status(500).json('Testcase already exists.');
            }

            db.createTestCase(name, clientId, testCase, function(result) {
                res.status(200).send(result);
            }, function(errCode, errReason) {
                return res.status(errCode).json(errReason);
            });
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json('Invalid parameters.');
    }
};
