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
const view_result_testing = globalDatabase.config.containers.view_result_testing;

exports.getTestRuns = function(clientId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(testResultContainer).view("testing", "getTestRuns", {
      group: true
    }, function(err, result) {
      if (err) {
        reject(err);
      }
      var resultArray = [];
      for (row of result.rows) {
        if (row.key[2] = clientId) {
          resultArray.push(new Date(row.key[0]));
        }
      }
      resolve(resultArray);
    });
  });
}

// compare two test cases with each other
exports.getTestComparison = function(baseRunDate, compareRunDate, clientId) {

  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(testResultContainer).find({
      "selector": {
        "clientId": clientId,
        "$or": [{
            "timestamp": baseRunDate
          },
          {
            "timestamp": compareRunDate
          }
        ]
      },
      "fields": [
        "_id",
        "id",
        "counter",
        "correct",
        "test",
        "timestamp"
      ]
    }, function(err, result) {
      if (err) {
        reject(err);
      }
      var resultArray = [];
      var resultObject = {};
      for (entry of result.docs) {
        var existingIndex = 0;
        for (index in resultArray) {
          if (resultArray[index]._id.id == entry.id && resultArray[index]._id.counter == entry.counter) {
            existingIndex = index;
          }
        }
        if (existingIndex > 0) {
          if (entry.timestamp > resultArray[existingIndex].timestamps[0]) {
            if (resultArray[existingIndex].result[0] !== entry.correct) {
              resultArray[existingIndex].result.push(entry.correct);
            }
            if (!(resultArray[existingIndex].test[0].input == entry.test.input) || !(resultArray[existingIndex].test[0].answerId == entry.test.answerId) || !(resultArray[existingIndex].test[0].intent == entry.test.intent) || !(resultArray[existingIndex].test[0].test_file == entry.test.test_file)) {
              resultArray[existingIndex].test.push(entry.test);
            }
            resultArray[existingIndex].timestamps.push(new Date(entry.timestamp));
            resultArray[existingIndex].resultId.push(entry._id);
          } else {
            if (resultArray[existingIndex].result[0] !== entry.correct) {
              resultArray[existingIndex].result.unshift(entry.correct);
            }
            if (!(resultArray[existingIndex].test[0].input == entry.test.input) || !(resultArray[existingIndex].test[0].answerId == entry.test.answerId) || !(resultArray[existingIndex].test[0].intent == entry.test.intent) || !(resultArray[existingIndex].test[0].test_file == entry.test.test_file)) {
              resultArray[existingIndex].test.unshift(entry.test);
            }
            resultArray[existingIndex].timestamps.push(new Date(entry.timestamp));
            resultArray[existingIndex].resultId.unshift(entry._id);
          }
        } else {
          resultArray.push({
            "_id": {
              "id": entry.id,
              "counter": entry.counter
            },
            "result": [
              entry.correct
            ],
            "counter": entry.counter,
            "step": entry.counter,
            "test": [entry.test],
            "timestamps": [new Date(entry.timestamp)],
            "resultId": [entry._id]
          });
        }
      }
      for(resultIndex in resultArray) {
        if (resultArray[resultIndex].result.length == 1) {
          delete resultArray[resultIndex];
        }
      }
      resolve(resultArray);

    });
  });
}


exports.getTestResult = function(resultId, clientId) {
  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(testResultContainer).find({
      "selector": {
        "_id": resultId,
        "clientId": clientId
      }
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.docs[0])
      }
    });
  });
}
