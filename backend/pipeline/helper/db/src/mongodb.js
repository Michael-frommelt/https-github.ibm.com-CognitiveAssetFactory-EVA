/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
const questionProposalsContainer = globalDatabase.config.containers.questionProposals;

exports.getQuestionsByEntities = function(entities, jargon, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(questionProposalsContainer).aggregate([{
        $match: {
            mainEntities: {
                $in: entities
            },
            proposalByEntity: true
        }
    }, {
        $group: {
            _id: {
                intent: {
                    $arrayElemAt: ["$intents", 0]
                }
            },
            result: {
                $push: {
                    mainEntities: "$mainEntities",
                    additionalEntities: "$additionalEntities",
                    options: "$questions.options"
                }
            }
        }
    }], function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result);
        }
    });
};

exports.getQuestionsByIntents = function(intents, jargon, callbackSuccess, callbackError) {
    globalDatabase.connection.collection(questionProposalsContainer).aggregate([{
        $match: {
            intents: {
                $in: intents
            },
            mainEntities: {
                $size: 0
            },
            additionalEntities: {
                $size: 0
            }
        }
    }, {
        $project: {
            intent: {
                $arrayElemAt: ["$intents", 0]
            },
            options: "$questions.options"
        }
    }], function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result);
        }
    });
};
