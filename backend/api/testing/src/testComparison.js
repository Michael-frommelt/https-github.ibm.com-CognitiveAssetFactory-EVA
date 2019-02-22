/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('../db/db.js').getDatabase().TESTCOMPARISON;
const permissions = require('../../../helper/permissions.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = app => {
    app.post('/api/testing/comparison/getTestRuns', permissions.mwHasPermission('editTesting'), this.getTestRuns);
    app.post('/api/testing/comparison/compareRuns', permissions.mwHasPermission('editTesting'), this.compareRuns);
    app.post('/api/testing/comparison/getTestResultDetails', permissions.mwHasPermission('editTesting'), this.getTestResultDetails);
};

// ##############################
// ## API                      ##
// ##############################

exports.getTestRuns = (req, res) => {
    var clientId = req.body.clientId;

    if (clientId) {
        db.getTestRuns(clientId).then(result => {
            const output = result.sort(function dateDescendingOrder(a, b) {
                if (a == b) return 0;
                if (a < b) return 1;
                if (a > b) return -1;
            });

            res.json(output.map((date) => date.toJSON()));
        }, error => res.status(500).send(error.message));
    } else {
        return res.status(400).json("Invalid parameters.");
    }
};

exports.compareRuns = (req, res) => {
    if (typeof req.body.baseRun !== 'string' || typeof req.body.compareRun !== 'string' || typeof req.body.clientId !== 'string') {
        return res.status(400).end();
    }
    const baseRunMillis = Date.parse(req.body.baseRun);
    const compareRunMillis = Date.parse(req.body.compareRun);
    const clientId = req.body.clientId;

    if (Number.isNaN(baseRunMillis) || Number.isNaN(compareRunMillis)) {
        return res.status(400).end();
    }

    db.getTestComparison(new Date(baseRunMillis), new Date(compareRunMillis), clientId).then(changedTestCases => {
        const positiveChangedTestCases = [];
        const negativeChangedTestCases = [];

        changedTestCases.forEach(changedTestCase => {
            if (changedTestCase.test.length !== 1 || changedTestCase.timestamps.length > 2) {
                console.log('Ignoring false positive changedTestCase due to possible duplicate test case IDs');
                return;
            }

            const baseRunIndex = changedTestCase.timestamps.findIndex(timestamp => timestamp.getTime() === baseRunMillis);
            const compareRunIndex = baseRunIndex === 0 ? 1 : 0;
            if (baseRunIndex === -1) return;

            const testCaseData = {
                caseId: changedTestCase.test[0].id,
                compareResultId: changedTestCase.resultId[compareRunIndex],
                input: changedTestCase.test[0].input,
                baseResultId: changedTestCase.resultId[baseRunIndex],
                step: changedTestCase.step,
                testFile: changedTestCase.test[0].test_file,
            };

            if (changedTestCase.result[baseRunIndex]) {
                negativeChangedTestCases.push(testCaseData);
            } else {
                positiveChangedTestCases.push(testCaseData);
            }
        });
        res.json({
            positiveChanged: positiveChangedTestCases,
            negativeChanged: negativeChangedTestCases,
        });
    }, error => res.status(500).send(error.message));
};

exports.getTestResultDetails = (req, res) => {
    if (typeof req.body.resultId !== 'string' || typeof req.body.clientId !== 'string') {
        return res.status(400).end();
    }

    db.getTestResult(req.body.resultId, req.body.clientId).then(testResult => {
        if (testResult == null) {
            return res.status(404).end();
        }

        return res.json(testResult);
    }, error => res.status(500).send(error.message));
};
