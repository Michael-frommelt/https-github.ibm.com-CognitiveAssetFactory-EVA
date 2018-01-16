/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var clients = require('../../../helper/clients.js');
var service = require('../../../helper/conversation.js');
var async = require('async');
var conversationConfig = require('../../../helper/config.js').getConfig('conversation');
var chitChatConfig = require('../../../helper/config.js').getConfig('chitchat');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.callConversation = {};
    resultHolder.debug.totalWcsCalls = 0;

    resultHolder.session.context.confidence_threshold = (chitChatConfig && chitChatConfig.wcs_confidence_level) ? chitChatConfig.wcs_confidence_level : 0.7;
    resultHolder.session.context.reassurance_threshold = (chitChatConfig && chitChatConfig.reassurance_confidence_level) ? chitChatConfig.reassurance_confidence_level : 0.7;
    resultHolder.session.context.welcomeMessageFromConfig = clients.findClientByIdInUser(resultHolder.user, resultHolder.clientId).welcomeMessageFromConfig;

    var conversation;
    try {
        conversation = service.getBusinessConversationSetup(resultHolder.clientId, resultHolder.user, resultHolder.isTest);
    } catch (err) {
        return callback(err, resultHolder);
    }

    var payload = {
        workspace_id: conversation.workspace,
        context: resultHolder.session.context,
        output: resultHolder.output,
        input: resultHolder.input,
        alternate_intents: conversationConfig.show_alternate_intents
    };

    resultHolder.debug.callConversation.payload = JSON.parse(JSON.stringify(payload));

    resultHolder.payload = payload;

    // Send the input to the conversation service
    conversation.service.message(payload, function(err, data) {
        resultHolder.debug.callConversation.data = data;
        resultHolder.debug.totalWcsCalls++;
        if (err) {
            resultHolder.debug.callConversation.success = false;
            return callback(err, resultHolder);
        }

        resultHolder.output = JSON.parse(JSON.stringify(data.output));
        resultHolder.debug.callConversation.data = JSON.parse(JSON.stringify(data));

        resultHolder.callConversation = {
            entities: data.entities || [],
            intents: data.intents || [],
        };

        var replacablePrompts = [];

        for (var index in resultHolder.output.text) {
            var found = false;
            if (resultHolder.output.text[index] == "%%promptPlaceholder%%") {
                replacablePrompts.push(index);
                if (!found) {
                    resultHolder.debug.callConversation.afterReplacablePrompts = [];
                }
                found = true;
            }
        }

        var inputStored = JSON.parse(JSON.stringify(resultHolder.input));

        resultHolder.session.context = data.context;
        resultHolder.currentContext = data.context;

        async.forEach(replacablePrompts, function(prompt, cb) {
            payload.input.text = "";
            payload.context = resultHolder.session.context;
            conversation.service.message(payload, function(err, data) {
                var replacablePromptDebug = {};
                replacablePromptDebug.data = JSON.parse(JSON.stringify(data));
                resultHolder.debug.callConversation.afterReplacablePrompts.push(replacablePromptDebug);
                resultHolder.debug.totalWcsCalls++;
                if (err) {
                    resultHolder.debug.callConversation.success = false;
                    cb();
                }
                var output = JSON.parse(JSON.stringify(data.output));
                resultHolder.output.text = resultHolder.output.text.slice(0, prompt).concat(output.text).concat(resultHolder.output.text.slice(prompt + 1));
                resultHolder.output.answer_id = resultHolder.output.answer_id.slice(0, prompt).concat(output.answer_id).concat(resultHolder.output.answer_id.slice(prompt));
                if (output.prevent_override) resultHolder.output.prevent_override = output.prevent_override;
                resultHolder.session.context = data.context;
                resultHolder.currentContext = data.context;
                cb();
            });
        }, function(err) {
            if (err) console.error(err);
            resultHolder.debug.callConversation.success = true;
            resultHolder.answerFrom = "callConversation";

            resultHolder.session.conversationId = data.context.conversation_id;
            resultHolder.output.topIntent = data.intents[0] ? data.intents[0].intent : undefined;
            resultHolder.output.confidence = data.intents[0] ? data.intents[0].confidence : 0.0;
            resultHolder.input = inputStored;

            return callback(null, resultHolder);
        });
    });
};
