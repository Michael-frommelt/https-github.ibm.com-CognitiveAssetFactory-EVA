/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

const testResultContainer = globalDatabase.config.containers.test_results;
const testFilesContainer = globalDatabase.config.containers.test_files;
const view_result_testing = globalDatabase.config.containers.view_result_testing;
const testView = globalDatabase.config.containers.testView;

// get test results aggregated by test case
exports.getTestcasePerformance = function(run, clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(view_result_testing).view("chainedQueries", "getTestCasePerformance_chained", {
    group: true,
    descending: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (let entry of result.rows) {
      if (entry.key[1] = clientId) {
        resultArray.push({
          "_id": {
            "date": entry.key[0]
          },
          "count": entry.value.count,
          "passed": entry.value.sum,
          "ratio": (entry.value.sum / entry.value.count)
        });
      }
    }
    return callbackSuccess(resultArray);
  });
};

// get test results aggregated by test steps
exports.getTeststepPerformance = function(run, clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(view_result_testing).view("chainedQueries", "getTestStepPerformance_chained", {
    group: true,
    descending: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (let entry of result.rows) {
      if (entry.key[1] = clientId) {
        resultArray.push({
          "_id": {
            "date": entry.key[0]
          },
          "count": entry.value.count,
          "passed": entry.value.sum,
          "ratio": (entry.value.sum / entry.value.count)
        });
      }
    }
    return callbackSuccess(resultArray);
  });
};

exports.getTestResultByFile = function(run, clientId, callbackSuccess, callbackError) {
  var timestamp = new Date(run);
  var month = timestamp.getMonth() + 1
  if (month < 10) {
    month = "0" + month;
  }
  var minutes = timestamp.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  var date = (timestamp.getFullYear() + "/" + month + "/" + timestamp.getDate() + " " + (timestamp.getHours()) + ":" + minutes + ":" + timestamp.getSeconds());
  return globalDatabase.connection.use(testView).view("testing_chainedTwice", "secondary_chainedView_file", {
    group: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (let entry of result.rows) {
      if (entry.key[1] == clientId) {
        var datesResult = [];
        for (valueEntry of entry.value) {
          for (value of valueEntry) {
            if (value[0] >= date) {
              var dateResult = {
                "date": value[0]
              };
              for (var subValue of value[1]) {
                for (var subSubValue of subValue) {
                  var key = Object.keys(subSubValue)[0];
                  dateResult[key] = subSubValue[key];
                }
              }
              dateResult["avgConfidence"] = dateResult["avgConfidence"] / dateResult["testTotal"];
              datesResult.push(dateResult);
            }
          }
        }
      }
      if (datesResult) {

        datesResult.sort(function(a, b) {
          if (a.date < b.date)
            return 1
          if (a.date > b.date)
            return -1
          return 0
        });

        resultArray.push({
          "_id": entry.key[0],
          "resultPerDate": datesResult
        });
      }
    }
    return callbackSuccess(resultArray);
  });
}

exports.getTestResultInDetail = function(run, key, value, clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(globalDatabase.config.containers.test_results).find({
    "selector": {
      "timestamp": {
        "$gte": new Date(run)
      },
      "clientId": clientId,
      ["test." + key]: value
    },
    "fields": [
      "date",
      "id",
      "test.answerId",
      "test.input",
      "counter",
      "body.confidence",
      "correctAnswerId",
      "correctTopIntent",
    ],
    "sort": [{
      "date": "desc"
    }]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (result of result.docs) {
      var inputIndex = resultArray.length;
      for (entry in resultArray) {
        if (resultArray[entry]._id == result.id) {
          inputIndex = entry;
        }
      }

      if (inputIndex == resultArray.length) {
        resultArray[inputIndex] = {
          _id: result.id,
          uuidResult: []
        };
      }

      var uuidResultIndex = 0;

      for (i in resultArray[inputIndex].uuidResult) {
        if (resultArray[inputIndex].uuidResult[i].input == result.test.input && resultArray[inputIndex].uuidResult[i].counter == result.counter) {
          uuidResultIndex = i;
        }
      }
      if (uuidResultIndex === 0) {
        resultArray[inputIndex].uuidResult.push({
          "input": result.test.input,
          "counter": result.counter,
          "answerId": result.test.answerId,
          "inputResult": []
        });
        uuidResultIndex = resultArray[inputIndex].uuidResult.length - 1;
      }
      resultArray[inputIndex].uuidResult[uuidResultIndex].inputResult.push({
          "date": result.date,
          "confidence": result.body.confidence,
          "correctAnswerId": result.correctAnswerId == true ? 1 : 0,
          "correctIntent": result.correctTopIntent == true ? 1 : 0,
      })
    }
    for (entry of resultArray) {
      entry.uuidResult.sort(function(a,b) {return (a.counter > b.counter) ? 1 : ((b.counter > a.counter) ? -1 : 0);} ); 

    }

    return callbackSuccess(resultArray);
  });
}

exports.getTestResultByIntent = function(run, clientId, callbackSuccess, callbackError) {
  var timestamp = new Date(run);
  var month = timestamp.getMonth() + 1
  if (month < 10) {
    month = "0" + month;
  }
  var date = (timestamp.getFullYear() + "/" + month + "/" + timestamp.getDate() + " " + (timestamp.getHours()) + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds());
  globalDatabase.connection.use(testView).view("testing_chainedTwice", "secondary_chainedView_intent", {
    group: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (let entry of result.rows) {
      if (entry.key[1] == clientId) {
        var datesResult = [];
        for (valueEntry of entry.value) {
          for (value of valueEntry) {
            if (value[0] >= date) {
              var dateResult = {
                "date": value[0]
              };
              for (var subValue of value[1]) {
                for (var subSubValue of subValue) {
                  var key = Object.keys(subSubValue)[0];
                  dateResult[key] = subSubValue[key];
                }
              }
              dateResult["avgConfidence"] = dateResult["avgConfidence"] / dateResult["testTotal"];
              datesResult.push(dateResult);
            }
          }
        }
      }

      if (datesResult && datesResult.length > 0) {
        datesResult.sort(function(a, b) {
          if (a.date < b.date)
            return 1
          if (a.date > b.date)
            return -1
          return 0
        });

        resultArray.push({
          "_id": entry.key[0],
          "resultPerDate": datesResult
        });
      }
    }
    return callbackSuccess(resultArray);
  });
}

//List all testTimes
exports.getRun = function(clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(testResultContainer).view("testing", "getTestRuns", {
    group: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    var resultArray = [];
    for (var i = 1; i < 6; i++) {
      if (result.rows.length - i >= 0 && result.rows[result.rows.length - i].key[2] == clientId) {
        resultArray.push({
          _id: {
            "timestamp": result.rows[result.rows.length - i].key[0],
            "date": result.rows[result.rows.length - i].key[1]
          }
        });
      }
    }
    return callbackSuccess(resultArray);
  });
};

//List names of test files
exports.getFileNames = function(clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(testFilesContainer).find({
    "selector": {
      "clientId": clientId
    },
    "fields": ["_id", "name"],
    "sort": [{
      "name": "asc"
    }]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    }
    return callbackSuccess(result.docs);
  });
};

exports.deleteTestrun = function(date, clientId, callbackSuccess, callbackError) {
  globalDatabase.connection.use(testResultContainer).find({
    "selector": {
      "date": date,
      "clientId": clientId
    }
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else {
      for (entry of result.docs) {
        entry._deleted = true;
      }
      globalDatabase.connection.use(testResultContainer).bulk({
        "docs": result.docs
      }, function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess();
      })
    }
  });
};
