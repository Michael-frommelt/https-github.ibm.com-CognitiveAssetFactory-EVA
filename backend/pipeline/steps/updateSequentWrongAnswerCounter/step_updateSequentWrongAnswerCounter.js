/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var questionProposals = require("../../helper/questionProposals.js");
var guidingConceptConfig = require('../../../helper/config.js').getConfig('guidingConcept');

exports.call = function(resultHolder, callback) {
    if (resultHolder.welcomeMessage) {
        resultHolder.debug.updateSequentWrongAnswerCounter = {};
        resultHolder.debug.updateSequentWrongAnswerCounter.skip = true;
        resultHolder.debug.updateSequentWrongAnswerCounter.skipReason = "welcomeMessage";
        return callback(null, resultHolder);
    }

    if (resultHolder.output.answer_id && ((resultHolder.output.answer_id.indexOf("Anything_else_1") != -1) || (resultHolder.output.answer_id.indexOf("Anything_else_2") != -1) || (resultHolder.output.answer_id.indexOf("Anything_else_3") != -1))) {
        if (resultHolder.output.answer_id.indexOf("Anything_else_1") == -1) {
            resultHolder.debug.anythingElse = {};
            resultHolder.debug.anythingElse.result = [];

            var entities = resultHolder.callConversation.entities;
            var intents = resultHolder.callConversation.intents;

            questionProposals.getQuestions(entities, intents, resultHolder.session.jargon, function(err, answer_id, answer_proposals, entity, result) {
                if (err) {
                    resultHolder.warnings.push(err + '');
                    return callback(null, resultHolder);
                }

                resultHolder.debug.anythingElse.result = result;
                resultHolder.output.answer_proposals = answer_proposals;

                if (entity != null) resultHolder.session.context.entity = entity;

                resultHolder.session.context.sequent_wrong_answer_counter++;
                resultHolder.setNegativeFeedback = true;
                if (resultHolder.session.context.sequent_wrong_answer_counter >= guidingConceptConfig.anything_else.wrong_answer_counter_limit) {
                    resultHolder.session.context.sequent_wrong_answer_counter = guidingConceptConfig.anything_else.wrong_answer_counter_limit;
                    resultHolder.output.lockLevel = 2;
                }

                return callback(null, resultHolder);
            });
        } else {
            resultHolder.session.context.sequent_wrong_answer_counter++;
            resultHolder.setNegativeFeedback = true;
            if (resultHolder.session.context.sequent_wrong_answer_counter >= guidingConceptConfig.anything_else.wrong_answer_counter_limit) {
                resultHolder.session.context.sequent_wrong_answer_counter = guidingConceptConfig.anything_else.wrong_answer_counter_limit;
                resultHolder.output.lockLevel = 2;
            }

            return callback(null, resultHolder);
        }
    } else {
        resultHolder.session.context.sequent_wrong_answer_counter = 0;

        return callback(null, resultHolder);
    }
};
