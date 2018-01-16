/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const conversationsLogsContainer = globalDatabase.config.containers.conversation_logs;
var async = require('async');

// gets the feedback per client
exports.getClientStatistic = function(filter, callbackSuccess, callbackError) {
  globalDatabase.connection.use(conversationsLogsContainer).view("statistics", "getClientStatisticView", {
    group: true
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.rows.length == 0) {
      return callbackSuccess();
    } else {
      var resultArray = [];
      async.series([
        function(callback) {
          for (entry of result.rows) {
            var resultEntry = {
              _id: entry.key,
              positiveCount: entry.value[0],
              negativeCount: entry.value[1],
              falseCount: entry.value[2],
            }
            resultArray.push(resultEntry);
          }
          callback(null, resultArray);
        },
        function(callback) {
          globalDatabase.connection.use(conversationsLogsContainer).view("statistics", "getFirstDate", {
            limit: 1
          }, function(err, secondResult) {
            if (err) {
              return callbackError(500, err);
            } else if (secondResult.rows.length == 0) {
              return callbackSuccess();
            } else {
              var resultObject = {
                resultData: resultArray,
                firstDate: [{
                  _id: "created",
                  firstDate: secondResult.rows[0].key
                }]
              };
              callback(null, resultObject);
            }
          });
        }
      ], function(err, returnResult) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(returnResult[1]);
      });
    }
  });
};

// gets all conversations (=users) in the given interval with timestamp ("created") grouped by day
exports.getUserStatistic = function(client, startFromFrontend, callbackSuccess, callbackError) {
  var start;

  if (startFromFrontend) { // get filter from frontend
    start = startFromFrontend;
  } else { // set filter to exact 1 month
    start = getFirstDayOfTheMonth();
  }


  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start
      }
    },
    "fields": ["username"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var queryResult = [{
        _id: "numOfUsers",
        total: removeDuplicates(result.docs, "username").length
      }];
      return callbackSuccess(queryResult);
    }
  });
};

// gets all conversations (=users) in the given interval with timestamp ("created") grouped by weekday
exports.getConversationsByDay = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
  var start, end;

  if (startFromFrontend && endFromBackend) { // get filter from frontend
    start = startFromFrontend;
    end = endFromBackend;
  }

  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start,
        "$lte": end
      }
    },
    "fields": ["created", "username"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultArray = [];
      async.series([
        function(callback) {
          for (i = 1; i < 8; i++) {
            resultArray.push({
              _id: {
                day: i,
              },
              testers: [],
              total: 0
            });
          };
          callback();
        },
        function(callback) {
          for (entry of result.docs) {
            var weekDay = new Date(7200000 + entry.created).getDay();
            if (resultArray[weekDay].testers.indexOf(entry.username) == -1) {
              resultArray[weekDay].total++;
              resultArray[weekDay].testers.push(entry.username);
            }
          }
          callback();
        },
        function(callback) {
          for (i = 0; i < resultArray.length; i++) {
            delete resultArray[i].testers;
          };
          callback();
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray);
      });
    }
  })
};

// gets all conversations (=users) in the given interval with timestamp ("created") grouped by hour
exports.getConversationsByHour = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
  var start, end;

  if (startFromFrontend && endFromBackend) { // get filter from frontend
    start = startFromFrontend;
    end = endFromBackend;
  }

  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start,
        "$lte": end
      }
    },
    "fields": ["created", "username"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultArray = [];
      async.series([
        function(callback) {
          for (i = 0; i < 24; i++) {
            resultArray.push({
              _id: {
                hour: i,
              },
              testers: [],
              total: 0
            });
          };
          callback();
        },
        function(callback) {
          for (entry of result.docs) {
            var hour = new Date(7200000 + entry.created).getHours();
            if (resultArray[hour].testers.indexOf(entry.username) == -1) {
              resultArray[hour].total++;
              resultArray[hour].testers.push(entry.username);
            }
          }
          callback();
        },
        function(callback) {
          for (i = 0; i < resultArray.length; i++) {
            delete resultArray[i].testers;
          };
          callback()
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray);
      });
    }
  })
};

// gets all conversations (=users) in the given interval with timestamp ("created") for longterm
exports.getConversationsLongterm = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
  var start, end;

  if (startFromFrontend && endFromBackend) { // get filter from frontend
    start = startFromFrontend;
    end = endFromBackend;
  }
  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start,
        "$lte": end
      }
    },
    "fields": ["created", "username"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultObject = {};
      var resultArray = [];
      async.series([
        function(callback) {
          for (entry of result.docs) {
            var dateString = new Date(new Date(7200000 + entry.created).toISOString().split('T')[0]);
            if (resultObject[dateString]) {
              if (resultObject[dateString].testers.indexOf(entry.username) == -1) {
                resultObject[dateString].total++;
                resultObject[dateString].testers.push(entry.username);
              }
            } else {
              resultObject[dateString] = {
                _id: {
                  day: dateString,
                },
                testers: [entry.username],
                total: 1
              }
            }
          }
          callback();
        },
        function(callback) {
          for (key in resultObject) {
            resultArray.push({
              _id: resultObject[key]._id,
              total: resultObject[key].total
            });
          };
          callback();
        },
        function(callback) {
          resultArray.sort(function(a, b) {
            return (a._id > b._id) ? 1 : ((b._id > a._id) ? -1 : 0);
          });
          callback();
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray);
      });
    }
  })
};

// gets all messages in the given interval
exports.getMessagesStatistic = function(client, callbackSuccess, callbackError) {
  var start = getFirstDayOfTheMonth();
  var end = Date.now();

  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start,
        "$lte": end
      }
    },
    "fields": [
      "created",
      "_id"
    ],
    "sort": [{
      "created": "asc"
    }]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    }
    return callbackSuccess(result.docs);
  });
};

// gets number of messages-buckets and how many users chatted that much,  in the given interval
// numOfUsersPerXMessages: 1: 3000user, 2: 2500user, 3:...
exports.getMessagesPerUser = function(client, start, end, callbackSuccess, callbackError) {
  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": start,
        "$lte": end
      }
    },
    "fields": ["username"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultObject = {};
      var secondResultObject = {};
      var resultArray = [];
      async.series([
        function(callback) {
          for (entry of result.docs) {
            if (resultObject[entry.username]) {
              resultObject[entry.username].count++;
            } else {
              resultObject[entry.username] = {
                username: entry.username,
                count: 1
              };
            }
          }
          callback();
        },
        function(callback) {
          for (key in resultObject) {
            if (secondResultObject[resultObject[key].count]) {
              secondResultObject[resultObject[key].count].users++;
            } else {
              secondResultObject[resultObject[key].count] = {
                _id: resultObject[key].count,
                numOfUsersPerXMessages: 1
              };
            }
          }
          callback();
        },
        function(callback) {
          for (key in secondResultObject) {
            resultArray.push(secondResultObject[key]);
          }
          resultArray.sort(function(a, b) {
            return (a._id > b._id) ? 1 : ((b._id > a._id) ? -1 : 0);
          });
          callback();
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray);
      });
    }
  })
};

// gets the 10 top intents in the given interval
exports.getTopIntentStatistic = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
  globalDatabase.connection.use(conversationsLogsContainer).find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": startFromFrontend,
        "$lte": endFromBackend
      }
    },
    "fields": ["topIntent"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultObject = {};
      var resultArray = [];
      async.series([
        function(callback) {
          for (entry of result.docs) {
            if (resultObject[entry.topIntent]) {
              resultObject[entry.topIntent].topIntentCount++;
            } else {
              resultObject[entry.topIntent] = {
                _id: entry.topIntent,
                topIntentCount: 1
              };
            }
          }
          callback();
        },
        function(callback) {
          for (key in resultObject) {
            resultArray.push(resultObject[key]);
          }
          resultArray.sort(function(a, b) {
            return (a.topIntentCount > b.topIntentCount) ? 1 : ((b.topIntentCount > a.topIntentCount) ? -1 : 0);
          });
          callback();
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray.slice(-10));
      });
    }
  })
};

// gets the number of all answerFrom in the given interval
exports.getAnswerFromStatistic = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
  globalDatabase.connection.use("conversation_logs").find({
    "selector": {
      "clientId": client,
      "created": {
        "$gte": startFromFrontend,
        "$lte": endFromBackend
      }
    },
    "fields": ["answerFrom"]
  }, function(err, result) {
    if (err) {
      return callbackError(500, err);
    } else if (result.docs.length == 0) {
      return callbackSuccess();
    } else {
      var resultObject = {};
      var resultArray = [];
      async.series([
        function(callback) {
          for (entry of result.docs) {
            if (resultObject[entry.answerFrom]) {
              resultObject[entry.answerFrom].answerFromCount++;
            } else {
              resultObject[entry.answerFrom] = {
                _id: entry.answerFrom,
                answerFromCount: 1
              };
            }
          }
          callback();
        },
        function(callback) {
          for (key in resultObject) {
            resultArray.push(resultObject[key]);
          }
          resultArray.sort(function(a, b) {
            return (a.answerFromCount < b.answerFromCount) ? 1 : ((b.answerFromCount < a.answerFromCount) ? -1 : 0);
          });
          callback();
        }
      ], function(err) {
        if (err) {
          return callbackError(500, err);
        }
        return callbackSuccess(resultArray);
      });
    }
  })
};

function getFirstDayOfTheMonth() {
  var d = new Date();
  var firstDayOfTheMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  return getThisMorning(firstDayOfTheMonth);
}

function getThisMorning(d) {
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.getTime();
}

function removeDuplicates(arr, key) {
  return arr.filter((obj, index, arr) => {
    return arr.map(mapObj => mapObj[key]).indexOf(obj[key]) === index;
  });
};
