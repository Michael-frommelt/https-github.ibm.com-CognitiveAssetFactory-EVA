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
const { Readable } = require('stream');

exports.saveFeedback = function(doc, callbackSuccess, callbackError) {
    if (doc._id == undefined) {
        globalDatabase.connection.use(conversationsLogsContainer).insert(doc, function(err, res) {
            if (err) {
                return callbackError(500, err);
            } else {
                doc._id = res.id;
                return callbackSuccess(doc);
            }
        });
    } else {
        globalDatabase.connection.use(conversationsLogsContainer).find({
            "selector": {
                "_id": doc._id
            }
        }, function(err, findResult) {
          if(err) {
            return callbackError(500, err);
          } else if (findResult.docs[0] != undefined) {
                doc._rev = findResult.docs[0]._rev;
                doc._id = findResult.docs[0]._id;
            }
            globalDatabase.connection.use(conversationsLogsContainer).insert(doc, function(err) {
                if (err) {
                    return callbackError(500, err);
                } else {
                    return callbackSuccess(doc);
                }
            });
        });
    }
};

exports.updateFeedback = function(id, object, callbackSuccess, callbackError) {
    globalDatabase.connection.use(conversationsLogsContainer).find({
        "selector": {
            "_id": id
        }
    }, function(err, findResult) {
      if (err) {
          return callbackError(500, err);
      } else if (findResult.docs[0] != undefined) {
            var insertObject = findResult.docs[0];
            for (var key in object) {
              insertObject[key] = object[key];
            }
            globalDatabase.connection.use(conversationsLogsContainer).insert(insertObject, function(err) {
                if (err) {
                    return callbackError('error_updating_document');
                } else {
                    globalDatabase.connection.use(conversationsLogsContainer).find({
                        "selector": {
                            _id: id
                        }
                    }, function(err, result) {
                        if (err) {
                            return callbackError('cannot_find_updated_document');
                        }
                        return callbackSuccess(result.docs[0]);
                    });
                }
            });
        } else {
            return callbackError('error_updating_document');
        }

    })
};

exports.deleteFeedback = function(id, callbackSuccess, callbackError) {

    globalDatabase.connection.use(conversationsLogsContainer).find({
        "selector": {
            "_id": id
        }
    }, function(err, result) {
        if (!err) {
            return globalDatabase.connection.use(conversationsLogsContainer).destroy(result.docs[0]._id, result.docs[0]._rev, function(err) {
                if (!err) {
                    return callbackSuccess();
                }
                return callbackError('error_deleting_document');
            })
        }
        return callbackError('error_deleting_document');
    })
};

exports.getFeedback = function(containerName, filter, limit, page, sorting, callbackSuccess, callbackError) {
    var filterObject = getFilterObject(filter);
    var skip = limit * (page - 1);
    var query = {};
    if (sorting && sorting.id) {
      var sortQuery = {};
        if (sorting.order === undefined) {
            sorting.order = 'desc';
        }
        sortQuery[sorting.id] = sorting.order;
        sortQuery = [sortQuery];
    }
    if (sortQuery) {
      query = {"selector": filterObject,
      "sort": sortQuery,
      "skip": skip,
      "limit": limit};
    } else {
      query = {"selector": filterObject,
      "skip": skip,
      "limit": limit};
    }

    globalDatabase.connection.use(containerName).find(query, function(err, result) {
        if (err) {
            return callbackError(500, err.errmsg || err.message);
        }
        return callbackSuccess(result.docs);
    });
};

exports.getFeedbackStream = function(containerName, filter, sorting) {
    var filterObject = getFilterObject(filter);

    var sortQuery;
    if (sorting && sorting.id) {
        sortQuery = {
            [sorting.id]: sorting.order === 'asc' ? 'asc' : 'desc',
        };
    }

    function accessFeedbackPage(batchBookmark, batchLimit) {
        return new Promise(function(resolve, reject) {
            globalDatabase.connection.use(containerName).find({
              selector: filterObject,
              sort: sortQuery == null ? [] : [sortQuery],
              bookmark: batchBookmark,
              limit: batchLimit,
            }, function(error, result) {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }

    var feedbackData = [];
    var limit = 200;
    var bookmark = null;
    var isLastBatch = false;
    var getData = function(myReadable) {
        var shouldPushNext = true;
        while(shouldPushNext) {
            if (feedbackData.length > 0) {
                shouldPushNext = myReadable.push(feedbackData.shift());
            } else if (isLastBatch) {
                shouldPushNext = false;
                myReadable.push(null);
            } else {
                shouldPushNext = false;
                accessFeedbackPage(bookmark, limit).then(function(resultData) {
                    console.log("result", resultData.docs.length);
                    console.log("bookmark", resultData.bookmark);
                    console.log("oldBookmark", bookmark);
                    if (bookmark === resultData.bookmark
                        || resultData.docs.length < limit) isLastBatch = true;
                    feedbackData = resultData.docs;
                    bookmark = resultData.bookmark;
                    getData(myReadable);
                }).catch(function(error) {
                    myReadable.destroy(error);
                });
            }
        }
    };

    return new Readable({
        objectMode: true,
        read: function() {
            var myReadable = this;
            getData(myReadable);
        },
    });
};

exports.distinctFeedback = function(containerName, columnId, callbackSuccess, callbackError) {
    if (containerName == conversationsLogsContainer && (columnId == "clientId" || columnId == "username" || columnId == "feedback" )) {
        globalDatabase.connection.use(conversationsLogsContainer).view("distinctViews", columnId, {
            group: true
        }, function(err, result) {
            if (err) {
                return callbackError(500, err.errmsg || err.message);
            }
            var distVals = [];
            for (row in result.rows) {
                distVals.push(result.rows[row].key);
            }
            return callbackSuccess(distVals);
        })
    } else {
        return callbackSuccess([]);
    }
};

exports.countFeedback = function(containerName, filter, callbackSuccess, callbackError) {
    var filterObject = getFilterObject(filter);

    globalDatabase.connection.use(containerName).find({
        "selector": filterObject,
        "fields": ["_id"]
    }, function(err, result) {
        if (err) {
            return callbackError(500, err.errmsg || err.message);
        } else {
            return callbackSuccess(result.docs.length);
        }
    });

};

exports.saveConversationFeedbackInternal = function(containerName, object) {

  return new Promise(function(resolve, reject) {
    if (object._id == undefined) {
        globalDatabase.connection.use(containerName).insert(object, function(err, body) {
          if(err) {
            reject(err);
          } else {
            resolve(body);
          }
        });
    } else {
        globalDatabase.connection.use(containerName).find({
            "selector": {
                "_id": object._id
            }
        }, function(err, findResult) {
            if (findResult.docs[0] != undefined) {
                object._rev = findResult.docs[0]._rev;
            }
            globalDatabase.connection.use(containerName).insert(object, function(err, body) {
              if(err) {
                reject(err);
              } else {
                resolve(body);
              }
            });
        });
    }
  });
};

function getFilterObject(filter) {
    if (filter !== undefined) {
        var filterObject = {};
        for (var columnId in filter) {
            var filterType = filter[columnId].type;
            if (filterType.indexOf('number') !== -1) {
                var value = filter[columnId].value;
                if (typeof value !== 'string') value = value.toString();
                if (filterType === 'number_equals') {
                    filterObject[columnId] = value;
                } else if (filterType === 'number_gt') {
                    filterObject[columnId] = {
                        '$gt': parseFloat(value)
                    };
                } else if (filterType === 'number_lt') {
                    filterObject[columnId] = {
                        '$lt': parseFloat(value)
                    };
                } else if (filterType === 'number_between') {
                    var numbers = value.split('-');
                    filterObject[columnId] = {
                        $gt: parseInt(numbers[0]),
                        $lt: parseInt(numbers[1])
                    };
                }
            } else if (filterType === 'like') {
                filterObject[columnId] = {
                    '$regex': filter[columnId].value
                };
            } else {
                filterObject[columnId] = filter[columnId].value;
            }
        }
        return filterObject;
    }
    return undefined;
}
