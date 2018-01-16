/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var service = require('../../../helper/conversation.js');
var config = require('../../../helper/config.js').getConfig('general');
var chitChatConfig = require('../../../helper/config.js').getConfig('chitchat');
var conversationConfig = require('../../../helper/config.js').getConfig('conversation');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.chitChat = {};

    var execution = false;

    if (chitChatConfig && chitChatConfig.enabled && !resultHolder.output[chitChatConfig.override_variable]) {
        if ((resultHolder.answerFrom === "callConversation" && (resultHolder.output.confidence < chitChatConfig.wcs_confidence_level || resultHolder.output.topIntent === conversationConfig.offtopic)) ||
            (resultHolder.answerFrom !== "callConversation" && resultHolder.output.confidence < chitChatConfig.other_confidence_level)) {

            execution = true;

            var chitChatContext = {};
            chitChatContext.question_counter = resultHolder.session.context.question_counter;
            chitChatContext.confidence_threshold = chitChatConfig.chitchat_confidence_level;
            chitChatContext.sequent_wrong_answer_counter = resultHolder.session.context.sequent_wrong_answer_counter;
            chitChatContext.non_business_question_score = resultHolder.session.context.non_business_question_score;
            chitChatContext.timezone = chitChatConfig.timezone;

            var chitChatConversation;
            try {
                chitChatConversation = service.getChitChatConversationSetup(resultHolder.clientId, resultHolder.user, resultHolder.isTest);
            } catch (err) {
                return callback(err, resultHolder);
            }

            var payload = {
                workspace_id: chitChatConversation.workspace,
                context: chitChatContext,
                input: resultHolder.input,
                output: {
                    actions: []
                }
            };

            chitChatConversation.service.message(payload, function(err, data) {
                resultHolder.debug.totalWcsCalls++;
                resultHolder.debug.chitChat.data = JSON.parse(JSON.stringify(data));
                resultHolder.chitChat = JSON.parse(JSON.stringify(data));
                if (!resultHolder.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("##### jump to chitchat");
                if (err) {
                    console.error('##### chitchat error');
                    resultHolder.debug.chitChat.success = false;
                    resultHolder.debug.chitChat.error = err;
                } else {
                    if (!resultHolder.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log('##### replace old answer by chitchat');
                    resultHolder.debug.chitChat.success = true;
                    resultHolder.answerFrom = "callChitChat";
                    resultHolder.currentContext = data.context;
                    resultHolder.output = data.output;
                    resultHolder.output.topIntent = data.intents[0] ? data.intents[0].intent : undefined;
                    resultHolder.output.confidence = data.intents[0] ? data.intents[0].confidence : 0.0;
                }

                return callback(null, resultHolder);
            });
        }
    }

    if (!execution) {
        callback(null, resultHolder);
    }
};
