/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const configContainer = globalDatabase.config.containers.config;

exports.deleteExpiredVersions = function(containerName, expirationTime) {
    return globalDatabase.connection.collection(containerName).deleteMany({
        markedForDeletionTime: {
            $lt: expirationTime
        }
    });
};

exports.getAnswer = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).findOne({
        answerId: answerId
    }, {
        _id: 0
    });
};

exports.upsertAnswer = function(containerName, answerId, answerObject, override) {
    let insertLogic = {};
    if (override === true) {
        insertLogic = {
            $set: answerObject
        };
    } else {
        insertLogic = {
            $setOnInsert: answerObject
        };
    }
    return globalDatabase.connection.collection(containerName).updateOne({
        answerId: answerId
    }, insertLogic, {
        upsert: true
    }).then(function(result) {
        return {
            inserted: result.upsertedId ? 1 : 0,
            modified: result.modifiedCount
        };
    });
};

exports.upsertVersion = function(containerName, answerId, versionDocument, limit) {
    return globalDatabase.connection.collection(containerName).findOne({
        answerId: answerId
    }).then(function(versionsDocument) {
        if (versionsDocument && Array.isArray(versionsDocument.versions) && typeof versionsDocument.versions[0].number === 'number') {
            return versionsDocument.versions[0].number + 1;
        }
        return 1;
    }).then(function(newVersionNumber) {
        versionDocument.number = newVersionNumber;
        return globalDatabase.connection.collection(containerName).updateOne({
            answerId: answerId
        }, {
            $push: {
                versions: {
                    $each: [versionDocument],
                    $position: 0,
                    $slice: limit
                }
            }
        }, {
            upsert: true
        });
    })
};

exports.deleteAnswer = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).deleteOne({
        answerId: answerId
    });
};

exports.markVersionForDeletion = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).updateOne({
        answerId: answerId
    }, {
        $set: {
            markedForDeletion: true,
            markedForDeletionTime: new Date()
        }
    });
};


exports.getVersions = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).findOne({
        answerId: answerId
    }, {
        _id: 0,
        versions: 1
    });
};

exports.getVersionsMarkedForDeletion = function(containerName) {
    return globalDatabase.connection.collection(containerName).find({
        markedForDeletion: true
    }, {
        _id: 0,
        versions: 1
    }).toArray();
};

exports.unmarkVersionForDeletion = function(containerName, answerId) {
    return globalDatabase.connection.collection(containerName).updateOne({
        answerId: answerId
    }, {
        $unset: {
            markedForDeletion: "",
            markedForDeletionTime: ""
        }
    });
};

exports.upsertAnswerProperty = function(propertyName, answerProperty) {
    // try updating an existing answerProperty in the nested array
    let updatePromise = globalDatabase.connection.collection(configContainer).updateOne({
        id: 'answerStore',
        'answerProperties.name': propertyName
    }, {
        $set: {
            'answerProperties.$': answerProperty
        }
    });
    return updatePromise.then(function(updateResult) {
        if (updateResult.matchedCount !== 0) {
            return updateResult;
        }
        // if there was no matching answerProperty in the nested array, insert it
        return globalDatabase.connection.collection(configContainer).updateOne({
            id: 'answerStore'
        }, {
            $addToSet: {
                'answerProperties': answerProperty
            }
        });
    });
};

exports.deleteAnswerProperty = function(propertyName) {
    return globalDatabase.connection.collection(configContainer).updateOne({
        id: 'answerStore'
    }, {
        $pull: {
            'answerProperties': {
                'name': propertyName
            }
        }
    });
};

exports.getAnswers = function(containerName, limit) {
    let cursor = globalDatabase.connection.collection(containerName).find({}, {
        _id: 0
    });

    if (limit) {
        cursor = cursor.limit(limit);
    }
    return cursor.toArray();
};
