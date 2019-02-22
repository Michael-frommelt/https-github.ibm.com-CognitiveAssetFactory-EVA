/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var questionProposals = require('../../helper/questionProposals.js');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.callFindQuestions = {};
    resultHolder.debug.callFindQuestions.result = [];

    // check if needed
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("callFindQuestions") !== -1) {
        resultHolder.debug.callFindQuestions.execution = true;
        var entities = resultHolder.callConversation.entities;
        var intents = resultHolder.callConversation.intents;

        questionProposals.getQuestions(entities, intents, resultHolder.session.jargon, function(err, answer_id, answer_proposals, entity, result) {
            if (err) {
                resultHolder.warnings.push(err + '');
                return callback(null, resultHolder);
            }

            resultHolder.answerFrom = "callFindQuestions";
            resultHolder.debug.callFindQuestions.result = result;

            answers = {};
            resultHolder.output.answer_proposals = answer_proposals;
            resultHolder.output.answer_id = answer_id;

            if (entity != null) resultHolder.session.context.entity = entity;

            return callback(null, resultHolder);
        });

    } else {
        resultHolder.debug.callFindQuestions.execution = false;
        return callback(null, resultHolder);
    }
};
