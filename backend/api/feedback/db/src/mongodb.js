/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var ObjectID = require('mongodb').ObjectID;
const conversationsLogsContainer = globalDatabase.config.containers.conversation_logs;

exports.saveFeedback = function(doc, callbackSuccess, callbackError) {
    var updated = false;
    if (doc._id !== undefined) {
        updated = true;
        doc._id = new ObjectID(doc._id);
    }

    globalDatabase.connection.collection(conversationsLogsContainer).save(doc, function(err) {
        if (err) {
            return callbackError(500, err.reason);
        } else {
            return callbackSuccess(doc);
        }
    });
};

exports.updateFeedback = function(id, object, callbackSuccess, callbackError) {
    var id = new ObjectID(id);

    globalDatabase.connection.collection(conversationsLogsContainer).update({
        _id: id
    }, {
        $set: object
    }, function(err, result) {
        if (err) {
            return callbackError('error_updating_document');
        }

        globalDatabase.connection.collection(conversationsLogsContainer).find({
            _id: id
        }).toArray(function(err, result) {
            if (err) {
                return callbackError('cannot_find_updated_document');
            }

            return callbackSuccess(result[0]);
        });
    });
};

exports.deleteFeedback = function(id, callbackSuccess, callbackError) {
    var id = new ObjectID(id);

    globalDatabase.connection.collection(conversationsLogsContainer).remove({
        _id: id
    }, function(err, result) {
        if (err) {
            return callbackError('error_deleting_document');
        }

        return callbackSuccess();
    });
};

exports.getFeedback = function(containerName, filter, limit, page, sorting, callbackSuccess, callbackError) {
    var filterObject = getFilterObject(filter);

    var skip = limit * (page - 1);

    var sortQuery = {};
    if (sorting && sorting.id) {
        if (sorting.order === undefined) {
            sorting.order = 'desc';
        }

        var sortingOrder = 0;
        if (sorting.order === 'asc') sortingOrder = 1;
        else if (sorting.order === 'desc') sortingOrder = -1;

        sortQuery[sorting.id] = sortingOrder;
    }

    globalDatabase.connection.collection(containerName).find(filterObject, {
        _id: 0
    }).sort(sortQuery).skip(skip).limit(limit).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err.errmsg || err.message);
        }
        return callbackSuccess(result);
    });
};

exports.getFeedbackStream = function(containerName, filter, sorting) {
    var filterObject = getFilterObject(filter);

    var sortQuery = {};
    if (sorting && sorting.id) {
        sortQuery[sorting.id] = sorting.order === 'asc' ? 1 : -1;
    }

    return globalDatabase.connection.collection(containerName).find(filterObject, {
        _id: 0
    }).sort(sortQuery);
};

exports.distinctFeedback = function(containerName, columnId, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(containerName).distinct(columnId, function(err, result) {
        if (err) {
            return callbackError(500, err.errmsg || err.message);
        }
        return callbackSuccess(result);
    });
};

exports.countFeedback = function(containerName, filter, callbackSuccess, callbackError) {
    var filterObject = getFilterObject(filter);

    globalDatabase.connection.collection(containerName).find(filterObject).count(function(err, result) {
        if (err) {
            return callbackError(500, err.errmsg || err.message);
        }
        return callbackSuccess(result);
    });
};

exports.saveConversationFeedbackInternal = function(containerName, object) {
    return globalDatabase.connection.collection(containerName).save(object);
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
