/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
const conversationsLogsContainer = globalDatabase.config.containers.conversation_logs;

// gets the feedback per client
exports.getClientStatistic = function(filter, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
        $group: {
            _id: "$clientId",
            positiveCount: {
                $sum: {
                    "$cond": [{
                        $eq: ["$feedback", "positive"]
                    }, 1, 0]
                }
            },
            negativeCount: {
                $sum: {
                    "$cond": [{
                        $eq: ["$feedback", "negative"]
                    }, 1, 0]
                }
            },
            falseCount: {
                $sum: {
                    "$cond": [{
                        $eq: ["$feedback", false]
                    }, 1, 0]
                }
            }
        }
    }]).toArray(function(err, resultData) {
        if (err) {
            return callbackError(500, err);
        }
        globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $group: {
                _id: "created",
                firstDate: {
                    $first: "$created"
                }
            }
        }]).toArray(function(err, resultFirstDate) {
            if (err) {
                return callbackError(500, err);
            }

            var result = {
                resultData: resultData,
                firstDate: resultFirstDate
            };

            return callbackSuccess(result);
        });
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


    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start
                    }
                }]
            }
        },
        {
            $group: {
                _id: "$username",
                "date": {
                    $first: "$created"
                }
            }
        },
        {
            $group: {
                _id: "numOfUsers",
                "total": {
                    "$sum": 1
                }
            }
        },
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets all conversations (=users) in the given interval with timestamp ("created") grouped by weekday
exports.getConversationsByDay = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
    var start, end;

    if (startFromFrontend && endFromBackend) { // get filter from frontend
        start = startFromFrontend;
        end = endFromBackend;
    }

    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start,
                        $lte: end
                    }
                }]
            }
        },
        {
            $group: {
                _id: {
                    "day": {
                        "$dayOfWeek": {
                            $add: [new Date(7200000), "$created"]
                        }
                    },
                    "userName": "$username",
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            $group: {
                _id: {
                    day: "$_id.day",
                },
                "total": {
                    "$sum": 1
                }

            }
        },
        {
            $sort: {
                "_id": 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets all conversations (=users) in the given interval with timestamp ("created") grouped by hour
exports.getConversationsByHour = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
    var start, end;

    if (startFromFrontend && endFromBackend) { // get filter from frontend
        start = startFromFrontend;
        end = endFromBackend;
    }

    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start,
                        $lte: end
                    }
                }]
            }
        },
        {
            $group: {
                _id: {
                    "hour": {
                        "$hour": {
                            $add: [new Date(7200000), "$created"]
                        }
                    },
                    "userName": "$username",
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            $group: {
                _id: {
                    hour: "$_id.hour",
                },
                "total": {
                    "$sum": 1
                }
            }
        },
        {
            $sort: {
                "_id": 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets all conversations (=users) in the given interval with timestamp ("created") for longterm
exports.getConversationsLongterm = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
    var start, end;

    if (startFromFrontend && endFromBackend) { // get filter from frontend
        start = startFromFrontend;
        end = endFromBackend;
    }

    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start,
                        $lte: end
                    }
                }]
            }
        },
        {
            $group: {
                _id: {
                    "day": {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: {
                                $add: [new Date(7200000), "$created"]
                            }
                        }
                    },
                    "userName": "$username",
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            $group: {
                _id: {
                    day: "$_id.day",
                },
                "total": {
                    "$sum": 1
                },
            }
        },
        {
            $sort: {
                "_id": 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets all messages in the given interval
exports.getMessagesStatistic = function(client, callbackSuccess, callbackError) {
    var start = getFirstDayOfTheMonth();
    var end = Date.now();

    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start,
                        $lte: end
                    }
                }]
            }
        },
        {
            $sort: {
                "created": 1
            }
        },
        {
            $project: {
                "created": 1,
                "_id": 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets number of messages-buckets and how many users chatted that much,  in the given interval
// numOfUsersPerXMessages: 1: 3000user, 2: 2500user, 3:...
exports.getMessagesPerUser = function(client, start, end, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: start,
                        $lte: end
                    }
                }]
            }
        },
        {
            $group: {
                _id: "$username",
                count: {
                    $sum: 1
                }
            }
        },
        {
            $group: {
                _id: "$count",
                numOfUsersPerXMessages: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets the 10 top intents in the given interval
exports.getTopIntentStatistic = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: startFromFrontend,
                        $lte: endFromBackend
                    }
                }]
            }
        },
        {
            $group: {
                _id: "$topIntent",
                topIntentCount: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                topIntentCount: -1
            }
        },
        {
            $limit: 10
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
};

// gets the number of all answerFrom in the given interval
exports.getAnswerFromStatistic = function(client, startFromFrontend, endFromBackend, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(conversationsLogsContainer).aggregate([{
            $match: {
                $and: [{
                    "clientId": {
                        $eq: client
                    }
                }, {
                    "created": {
                        $gte: startFromFrontend,
                        $lte: endFromBackend
                    }
                }]
            }
        },
        {
            $group: {
                _id: "$answerFrom",
                answerFromCount: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                answerFromCount: -1
            }
        }
    ]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        return callbackSuccess(result);
    });
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
    // var unixtime = Date.parse(d);
    // unixtime = unixtime + (new Date().getTimezoneOffset()*60000);
    //   console.log(unixtime) //TODO
    return d.getTime();
}
