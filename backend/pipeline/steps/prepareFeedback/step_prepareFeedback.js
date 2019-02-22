/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
exports.call = function(resultHolder, callback) {
    resultHolder.debug.prepareFeedback = {};
    if (resultHolder.session.feedback === undefined) resultHolder.session.feedback = {};
    var feedback = {};
    feedback.conversationId = resultHolder.session.conversationId;
    feedback.messageId = resultHolder.session.messageId;
    feedback.clientId = resultHolder.clientId;
    feedback.username = resultHolder.user.username;
    feedback.question = resultHolder.input.text;
    feedback.originalQuestion = resultHolder.originalInput.text;
    feedback.answer = "";
    if (resultHolder.output.text) {
        resultHolder.output.text.forEach(function(text) {
            feedback.answer += text;
        });
    }
    feedback.longAnswerId = resultHolder.output.answer_id ? resultHolder.output.answer_id : undefined;
    if (resultHolder.callConversation.intents.length > 0) {
        var intent = resultHolder.callConversation.intents[0];
        feedback.topIntent = intent ? intent.intent : undefined;
        feedback.topConfidence = intent ? intent.confidence : 0;
    }
    if (resultHolder.callConversation.entities.length > 0) {
        feedback.entities = resultHolder.callConversation.entities;
    }
    feedback.answerFrom = resultHolder.answerFrom;
    feedback.saved = false;
    resultHolder.session.feedback[resultHolder.session.messageId] = feedback;
    resultHolder.debug.prepareFeedback.createdFeedback = feedback;
    resultHolder.output.messageId = feedback.messageId;

    return callback(null, resultHolder);
};
