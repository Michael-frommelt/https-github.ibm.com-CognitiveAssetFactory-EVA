/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var clients = require('../../../helper/clients.js');
var guidingConceptConfig = require('../../../helper/config.js').getConfig('guidingConcept');

exports.call = function(resultHolder, callback) {
    if (resultHolder.session.context.question_counter === undefined) {
        if (clients.findClientByIdInUser(resultHolder.user, resultHolder.clientId).welcomeMessageFromConfig) {
            resultHolder.session.context.question_counter = 1;
        } else {
            resultHolder.session.context.question_counter = 0;
        }
    } else {
        resultHolder.session.context.question_counter++;
    }

    // Leitkonzept für AnythingElse
    if (resultHolder.session.context.sequent_wrong_answer_counter === undefined) {
        resultHolder.session.context.sequent_wrong_answer_counter = guidingConceptConfig.anything_else.wrong_answer_counter_init;
    }
    // Leitkonzept für Online-Abschluss
    if (resultHolder.session.context.business_question_counter === undefined) {
        resultHolder.session.context.business_question_counter = 0;
    }
    // Leitkonzept für Zurück-zum-Thema
    if (resultHolder.session.context.non_business_question_score === undefined) {
        resultHolder.session.context.non_business_question_score = guidingConceptConfig.back_to_topic.non_business_question_score_init;
    }
    /*var lastMessageId = resultHolder.session.messageId - 1;
    if (lastMessageId >= 0 && resultHolder.session.feedback !== undefined && resultHolder.session.feedback[lastMessageId] !== undefined) {
        var lastMessageFeedback = resultHolder.session.feedback[lastMessageId];
        if (!lastMessageFeedback.feedback || !lastMessageFeedback.feedback === 'negative') {
            resultHolder.session.context.sequent_wrong_answer_counter = 0;
        }
    }*/

    return callback(null, resultHolder);
};
