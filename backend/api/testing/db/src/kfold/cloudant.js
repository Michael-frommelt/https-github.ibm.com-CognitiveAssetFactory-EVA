/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

const kfoldContainer = globalDatabase.config.containers.kfold;
const async = require('async');
const uuidv4 = require('uuid/v4');

exports.insertTestResults = function(kFoldResults, callbackSuccess, callbackError) {
  var generatedUUID = uuidv4();

  globalDatabase.connection.use(kfoldContainer).insert({
    type: "resultHolder",
    date: kFoldResults.date,
    timestamp: kFoldResults.timestamp,
    clientId: kFoldResults.clientId,
    uuid: generatedUUID
  }, function(err, res) {
    if (err) {
      callbackError(500, err);
    }
    async.series([
      function(callback) {
        async.forEach(kFoldResults.frequency, function(fObject, callback) {
          globalDatabase.connection.use(kfoldContainer).insert({
            type: "frequencyObject",
            resultHolderId: generatedUUID,
            frequencyObject: fObject
          }, function(err) {
            callback();
          });
        }, function(err) {
          if (err) {
            callbackError(500, err);
          }
          callback();
        });
      },
      function(callback) {
        async.forEach(kFoldResults.result, function(rArray, callback) {
          globalDatabase.connection.use(kfoldContainer).insert({
            type: "resultArray",
            resultHolderId: generatedUUID,
            resultArray: rArray
          }, function(err) {
            callback();
          });
        }, function(err) {
          if (err) {
            callbackError(500, err);
          }
          callback();
        });
      }
    ], function(err) {
      if (err) {
        callbackError(500, err);
      }
      callbackSuccess([{
        "ok": true
      }]);
    });
  });
};

exports.aggregateTestResults = function(date, callbackSuccess, callbackError) {
  globalDatabase.connection.use(kfoldContainer).find({
    selector: {
      type: "resultHolder",
      date: date
    }
  }, function(err, resultHolder) {
    if (err) {
      return callbackError(500, err);
    }

    if (resultHolder.docs[0] == undefined) {
      return callbackError(500, "no results");
    }
    var resultHolderUuid = resultHolder.docs[0].uuid;

    globalDatabase.connection.use(kfoldContainer).view("testing", "aggregateTestResults", {
      group: true
    }, function(err, result) {
      if (err) {
        return callbackError(500, err);
      }
      var resultArray = [];
      for (let entry of result.rows) {

        if (entry.key[0] == resultHolderUuid) {
          resultArray.push({
            "_id": {
              "intent": entry.key[1],
              "date": date
            },
            "totalConfidenceAverage": entry.value[0] / entry.value[3],
            "totalSuccessRatioAverage": entry.value[1] / entry.value[3],
            "totalTestCases": entry.value[2]
          });
        }
      }
      if (result && resultArray.length == 0) {
        return callbackError(500, "No results found.");
      }
      return callbackSuccess(resultArray);
    });
  });
}


exports.getTestResult = function(date, clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(kfoldContainer).find({
    "selector": {
      type: "resultHolder",
      date: date,
      clientId: clientId
    }
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackError(500, "No results found.");
    } else {
      var resultObject = {};
      resultObject.date = result.docs[0].date;
      resultObject.timestamp = result.docs[0].timestamp;
      resultObject.clientId = result.docs[0].clientId;
      var targetUUID = result.docs[0].uuid;
      globalDatabase.connection.use(kfoldContainer).find({
        "selector": {
          type: "frequencyObject",
          resultHolderId: targetUUID
        }
      }, function(err, frequencyResult) {
        if (err) {
          return callbackError(500, err);
        }
        resultObject.frequency = [];
        for (doc of frequencyResult.docs){
          resultObject.frequency.push(doc.frequencyObject);
        }

        globalDatabase.connection.use(kfoldContainer).find({
          "selector": {
            type: "resultArray",
            resultHolderId: targetUUID
          }
        }, function(err, arrayResult) {
          if (err) {
            return callbackError(500, err);
          }

          resultObject.result = [];
          for (doc of arrayResult.docs){
            resultObject.result.push(doc.resultArray);
          }
          return callbackSuccess([resultObject]);
        });
      });
    }
  });
};

exports.getTestTimes = function(clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(kfoldContainer).view("testing", "getTestTimes", {
    group: true,
    descending: true,
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (let entry of result.rows) {
      if (entry.key[0] = clientId) {
        resultArray.push({
          "_id": entry.key[1],
          "count": entry.value
        });
      }
    }
    return callbackSuccess(resultArray);
  });
};
