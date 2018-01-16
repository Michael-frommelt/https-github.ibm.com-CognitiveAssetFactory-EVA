/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().TABLEVIEW;
const permissions = require('../../../helper/permissions.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    // get last 5 runDates for table view
    app.post('/api/testing/tableview/getRun', permissions.mwHasPermission('editTesting'), this.getTimeForLastFiveTests);
    // get names of training files
    app.post('/api/testing/tableview/getFileNames', permissions.mwHasPermission('editTesting'), this.getFileNames);
    // get performance per date and file
    app.post('/api/testing/tableview/getTestResultByFile', permissions.mwHasPermission('editTesting'), this.getTestResultByFile);
    // get performance per date and actual intent
    app.post('/api/testing/tableview/getTestResultByIntent', permissions.mwHasPermission('editTesting'), this.getTestResultByIntent);
    // get performance per date and file per testcase
    app.post('/api/testing/tableview/getTestResultByFileDetail', permissions.mwHasPermission('editTesting'), this.getTestResultByFileDetail);
    // get performance per date and actual intent per testcase
    app.post('/api/testing/tableview/getTestResultByIntentDetail', permissions.mwHasPermission('editTesting'), this.getTestResultByIntentDetail);
    // get performance on intent level for table view
    app.post('/api/testing/tableview/getTestcasePerformance', permissions.mwHasPermission('editTesting'), this.getTestcasePerformance);
    // get performance on intent level for table view
    app.post('/api/testing/tableview/getTeststepPerformance', permissions.mwHasPermission('editTesting'), this.getTeststepPerformance);
    // delete test run
    app.post('/api/testing/tableview/deleteRun', permissions.mwHasPermission('editTesting'), this.deleteTestrun);
};

// ##############################
// ## API                      ##
// ##############################

exports.getTestcasePerformance = function(req, res) {
    var run = req.body.run;
    var clientId = req.body.clientId;

    if (run && clientId) {
        db.getTestcasePerformance(run, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getTestcasePerformance: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTeststepPerformance = function(req, res) {
    var run = req.body.run;
    var clientId = req.body.clientId;

    if (run && clientId) {
        db.getTeststepPerformance(run, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getTeststepPerformance: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestResultByFile = function(req, res) {
    var run = req.body.run;
    var clientId = req.body.clientId;

    if (run && clientId) {
        db.getTestResultByFile(run, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestResultByFileDetail = function(req, res) {
    var run = req.body.run;
    var object = req.body.object;
    var clientId = req.body.clientId;

    if (run && object && clientId) {
        db.getTestResultByFileDetail(run, object, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestResultByIntent = function(req, res) {
    var run = req.body.run;
    var clientId = req.body.clientId;

    if (run && clientId) {
        db.getTestResultByIntent(run, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTestResultByIntentDetail = function(req, res) {
    var run = req.body.run;
    var object = req.body.object;
    var clientId = req.body.clientId;

    if (run && object && clientId) {
        db.getTestResultByIntentDetail(run, object, clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.getTimeForLastFiveTests = function(req, res) {
    var clientId = req.body.clientId;

    if (clientId) {
        db.getRun(clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getRun: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid clientId.");
    }
};

exports.getFileNames = function(req, res) {
    var clientId = req.body.clientId;

    if (clientId) {
        db.getFileNames(clientId, function(result) {
            res.status(200).send(result);
        }, function(errCode, errReason) {
            console.log("An error occurred in getRun: " + errReason);
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("invalid clientId");
    }

};

exports.deleteTestrun = function(req, res) {
    var date = req.body.date;
    var clientId = req.body.clientId;

    if (date && clientId) {
        db.deleteTestrun(date, clientId, function() {
            res.status(200).json({
                success: true
            });
        }, function(errCode, errReason) {
            return res.status(errCode).json(errReason);
        });
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};
