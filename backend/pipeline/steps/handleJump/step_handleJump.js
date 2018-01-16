/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var service = require('../../../helper/conversation.js');
var jumpHandler = require('./src/util.js');
var chitChatConfig = require('../../../helper/config.js').getConfig('chitchat');

exports.call = function(resultHolder, callback) {
    var businessConversation;
    try {
        businessConversation = service.getBusinessConversationSetup(resultHolder.clientId, resultHolder.user, resultHolder.isTest);
    } catch (err) {
        return callback(err, resultHolder);
    }

    var chitChatConversation;
    if (chitChatConfig && chitChatConfig.enabled) {
        try {
            chitChatConversation = service.getChitChatConversationSetup(resultHolder.clientId, resultHolder.user, resultHolder.isTest);
        } catch (err) {
            return callback(err, resultHolder);
        }
    } else {
        chitChatConversation = {
            service: null,
            workspace: null
        };
    }

    var conversationStore = {
        business: {
            service: businessConversation.service,
            workspace: businessConversation.workspace
        },
        chitchat: {
            service: chitChatConversation.service,
            workspace: chitChatConversation.workspace
        }
    };

    jumpHandler.handleJump(resultHolder, conversationStore, function(warning, newResultHolder) {
        if (warning) {
            newResultHolder.warnings = newResultHolder.warnings.concat(warning);
        }
        return callback(null, newResultHolder);
    });
};
