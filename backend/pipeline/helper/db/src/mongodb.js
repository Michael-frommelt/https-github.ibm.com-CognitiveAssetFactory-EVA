/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
    }]).toArray(function(err, result) {
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
    }]).toArray(function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            return callbackSuccess(result);
        }
    });
};
