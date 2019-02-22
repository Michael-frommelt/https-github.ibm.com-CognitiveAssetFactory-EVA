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
    globalDatabase.connection.use(questionProposalsContainer).find({
        "selector": {
            "mainEntities": {
                $in: entities
            },
            "proposalByEntity": true,
            "questions.options": {
                "$elemMatch": {
                    "properties.jargon": jargon
                }
            }
        },
        "fields": [
            "intents",
            "mainEntities",
            "additionalEntities",
            "questions.options"
        ]
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        }
        var resultArray = [];

        for (result of result.docs) {
            var inputIndex = resultArray.length;
            for (entry in resultArray) {
                if (resultArray[entry]._id.intent == result.intents[0]) {
                    inputIndex = entry;
                }
            }

            if (inputIndex == resultArray.length) {
                resultArray[inputIndex] = {
                    _id: {
                        intent: result.intents[0]
                    },
                    result: []
                }
            }
            resultArray[inputIndex].result.push({
                "mainEntities": result.mainEntities,
                "additionalEntities": result.additionalEntities,
                "options": result.questions.options
            })

        }
        return callbackSuccess(resultArray);
    });
};

exports.getQuestionsByIntents = function(intents, jargon, callbackSuccess, callbackError) {
    globalDatabase.connection.use(questionProposalsContainer).find({
        "selector": {
            intents: {
                $in: intents
            },
            "mainEntities": {
                "$size": 0
            },
            "additionalEntities": {
                "$size": 0
            },
            "questions.options": {
                "$elemMatch": {
                    "properties.jargon": jargon
                }
            }
        },
        "fields": [
            "intents",
            "questions.options"
        ]
    }, function(err, result) {
        if (err) {
            return callbackError(500, err);
        } else {
            for (var i = 0; i < result.docs.length; i++) {
                result.docs[i].intent = result.docs[i].intents[0];
                result.docs[i].options = result.docs[i].questions.options;
                delete result.docs[i].intents;
                delete result.docs[i].questions;
            }
            return callbackSuccess(result.docs);
        }

    });
};
