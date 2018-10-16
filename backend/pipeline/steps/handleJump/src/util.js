/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

var async = require('async');
var conversationConfig = require('../../../../helper/config.js').getConfig('conversation');
var jumpHandlingConfig = require('../../../../helper/config.js').getConfig('jumpHandling');
var chitchatConfig = require('../../../../helper/config.js').getConfig('chitchat');
var config = {
    conversation: conversationConfig,
    jumpHandling: jumpHandlingConfig,
    chitchat: chitchatConfig
};

exports.handleJump = function(newInput, conversationStore, callback) {
    var jumpConfig = getConfig();

    if (!newInput.session.hasOwnProperty('handleJump')) {
        newInput.session.handleJump = {};
    }
    newInput.debug.handleJump = {};

    //disabled jumps
    if (!jumpConfig.enabled) {
        if (newInput.output.actions && newInput.output.actions.indexOf("checkForOldContext") !== -1) {
            continueWithConversation(newInput, false, conversationStore.business.service, conversationStore.business.workspace, jumpConfig, function(err, output) {
                if (err) {
                    let warning = "ERROR occurred during jumpHandling, returning input resutHolder! Caused by: " + err;
                    return callback(warning, newInput);
                }
                return callback(null, output);
            });
        } else {
            return callback(null, newInput);
        }
    } else {

        //enabled jumps
        newInput = storeTopIntent(newInput);

        if (newInput.session.handleJump.contextStore) {
            newInput.session.handleJump.contextStore = manageContextStore(newInput);
        } else {
            newInput.session.handleJump.contextStore = [];
        }

        var oldInput;
        if (newInput.session.handleJump.contextStore.length > 1) {
            oldInput = mockOldInput(newInput);
        }

        var businessConfidenceThreshold = jumpConfig.businessConfidenceThreshold;
        var chitchatConfidenceThreshold = jumpConfig.chitchatConfidenceThreshold;
        var switchWorkspaceThreshold = jumpConfig.switchWorkspaceThreshold;

        var conversation = conversationStore.business.service;
        var workspace = conversationStore.business.workspace;

        newInput = createPreviousTopic(newInput, oldInput, jumpConfig);

        var newTopIntent = getTopIntentFromSession(newInput);

        newInput = debugConditions(newInput, oldInput, jumpConfig);

        var fallback = JSON.parse(JSON.stringify(newInput));

        if (newInput.output.actions && newInput.output.actions.indexOf("checkForOldContext") === -1 && newInput.output.actions.indexOf("restoreOldContext") === -1 && newInput.output.actions.indexOf("purgeOldContext") === -1) {
            if (evaluateJumpConditions(newInput, oldInput, jumpConfig)) {
                if (newTopIntent.confidence > businessConfidenceThreshold && newTopIntent.name != config.conversation.offtopic ) {
                    executeJump(newInput, oldInput, conversation, workspace, jumpConfig, function(err, output) {
                        if (err) return handleError(err, newInput, callback);

                        if (jumpConfig.noBackToTopicIntents.indexOf(newTopIntent.name) !== -1) {
                            continueWithConversation(newInput, false, conversation, workspace, jumpConfig, function(err, newInput) {
                                if (err) return handleError(err, newInput, callback);

                                return callback(null, newInput);
                            });
                        } else {
                            if (!output.session.context.isDialog) {
                                if (jumpConfig.dialog2qa == "automatic") {
                                    mergeNewResultWithOldResult(output, fallback, jumpConfig, function(mergedOutput) {
                                        return callback(null, mergedOutput);
                                    });
                                } else if (jumpConfig.dialog2qa == "prompt") {
                                    continueWithConversationNonDialog(output, conversation, workspace, jumpConfig.continuationSystemContext, function(err, promptOutput) {
                                        if (err) return handleError(err, newInput, callback);

                                        return callback(null, promptOutput);
                                    });
                                } else {
                                    newInput.session.context = newInput.session.handleJump.contextStore[0].sessionContext;
                                    newInput.payload.context = newInput.session.handleJump.contextStore[0].payloadContext;
                                    newInput.output = newInput.session.handleJump.contextStore[0].output;
                                    newInput.input = newInput.session.handleJump.contextStore[0].input;
                                    return callback(null, newInput);
                                }

                            } else {

                                var oldTopIntent = getTopIntentFromSession(oldInput);
                                newTopIntent = getTopIntentFromSession(newInput);

                                if (oldTopIntent && oldTopIntent.confidence > jumpConfig.businessConfidenceThreshold && !oldInput.session.handleJump.wasMerged && oldTopIntent.name != newTopIntent.name && oldInput.answerFrom !== "callChitChat") {
                                    output.session.handleJump.previousTopic = oldTopIntent.name;
                                }

                                if (jumpConfig.dialog2dialog == "prompt" || jumpConfig.dialog2dialog == "automatic") {
                                    return callback(null, output);
                                } else {
                                    return callback(null, newInput);
                                }
                            }
                        }
                    });
                } else if ((config.chitchat && config.chitchat.enabled) && (newTopIntent.confidence < switchWorkspaceThreshold || newTopIntent.name == config.conversation.offtopic)) {
                    checkChitChat(newInput, conversationStore.chitchat.service, conversationStore.chitchat.workspace, function(err, chitchatInput) {
                        if (err) return handleError(err, newInput, callback);

                        if (jumpConfig.noBackToTopicIntents.indexOf(newTopIntent.name) !== -1 && newTopIntent.confidence > chitchatInput.output.confidence) {
                            continueWithConversation(newInput, false, conversation, workspace, jumpConfig, function(err, newInput) {
                                if (err) return handleError(err, newInput, callback);

                                return callback(null, newInput);
                            });
                        } else {
                            if (chitchatInput.output.confidence > chitchatConfidenceThreshold) {
                                if (jumpConfig.dialog2chitchat == "automatic") {
                                    mergeNewResultWithChitChat(newInput, chitchatInput, jumpConfig, function(err, mergedOutput) {
                                        if (err) return handleError(err, newInput, callback);

                                        return callback(null, mergedOutput);
                                    });
                                } else if (jumpConfig.dialog2chitchat == "prompt") {
                                    continueWithConversationAfterChitChat(chitchatInput, newInput, conversation, workspace, jumpConfig, function(err, fallbackInput) {
                                        if (err) return handleError(err, newInput, callback);

                                        return callback(null, fallbackInput);
                                    });
                                } else {
                                    newInput.session.context = newInput.session.handleJump.contextStore[0].sessionContext;
                                    newInput.payload.context = newInput.session.handleJump.contextStore[0].payloadContext;
                                    newInput.output = newInput.session.handleJump.contextStore[0].output;
                                    newInput.input = newInput.session.handleJump.contextStore[0].input;
                                    return callback(null, newInput);
                                }
                            } else {
                                return callback(null, newInput);
                            }
                        }
                    });
                } else {
                    return callback(null, newInput);
                }
            } else {
                return callback(null, newInput);
            }
        } else {
            if ((newInput.output.actions.indexOf("checkForOldContext") !== -1)) {
                if (newInput.session.handleJump.storedContext) {
                    if (jumpConfig.dialog2dialog != "automatic") {
                        logCheck();

                        newInput.session.context.previousTopic = '${' + newInput.session.handleJump.previousTopic + '}';
                        if (newInput.currentContext) newInput.currentContext.previousTopic = newInput.session.context.previousTopic;

                        continueWithConversation(newInput, true, conversation, workspace, jumpConfig, function(err, newInput) {
                            if (err) return handleError(err, newInput, callback);

                            return callback(null, newInput);
                        });
                    } else {
                        var merger = JSON.parse(JSON.stringify(newInput.output));
                        restoreOldContext(newInput, jumpConfig, conversation, workspace, function(err, output) {
                            if (err) return handleError(err, newInput, callback);

                            if (jumpConfig.announceAutoMerge) {
                                output.output.answer_id = merger.answer_id.concat(['Back_to_topic_automatic']).concat(output.output.answer_id);
                            } else {
                                output.output.answer_id = merger.answer_id.concat(output.output.answer_id);
                            }
                            output.output.text = merger.text.concat(output.output.text).filter(function(n) {
                                return n != ""
                            });
                            output.output.nodes_visited = merger.nodes_visited.concat(output.output.nodes_visited);
                            output.output.log_messages = merger.log_messages.concat(output.output.log_messages);
                            return callback(null, output);
                        });
                    }
                } else {
                    continueWithConversation(newInput, false, conversation, workspace, jumpConfig, function(err, newInput) {
                        if (err) return handleError(err, newInput, callback);

                        return callback(null, newInput);
                    });
                }
            } else if (newInput.output.actions.indexOf("restoreOldContext") !== -1) {

                restoreOldContext(newInput, jumpConfig, conversation, workspace, function(err, returnedNewInput) {
                    if (err) return handleError(err, newInput, callback);

                    return callback(null, returnedNewInput);
                });
            } else if (newInput.output.actions.indexOf("purgeOldContext") !== -1) {
                purgeOldContext(newInput, function(err, returnedNewInput) {
                    if (err) return handleError(err, newInput, callback);

                    return callback(null, returnedNewInput);
                });
            } else {
                return callback(null, newInput);
            }
        }
    }
}

function executeJump(newInput, oldInput, conversation, workspace, jumpConfig, callback) {
    if (newInput.session.context.isDialog && jumpConfig.dialog2dialog == "blocked") {
        return callback(null, newInput);
    }
    newInput.debug.handleJump.action = "executeJump";
    logJump();

    var temp;
    if (newInput.session.handleJump.contextStore[1].actions.indexOf("restoreOldContext") === -1) {
        temp = JSON.parse(JSON.stringify(newInput.session.handleJump.contextStore[1]));
        newInput.session.handleJump.tempStorage = temp;
    } else {
        temp = newInput.session.handleJump.tempStorage;
    }

    var payload = {
        workspace_id: workspace,
        context: {
            system: jumpConfig.openingSystemContext
        },
        output: {
            answer_id: [],
            actions: []
        },
        input: newInput.input,
        alternate_intents: config.conversation.show_alternate_intents
    };

    if (jumpConfig.persistentContextVars && jumpConfig.persistentContextVars.length > 0) {
        for (var i = 0; i < jumpConfig.persistentContextVars.length; i++) {
            if (temp.payloadContext[jumpConfig.persistentContextVars[i]]) {
                payload.context[jumpConfig.persistentContextVars[i]] =
                    temp.payloadContext[jumpConfig.persistentContextVars[i]];
            }
        }
    }

    callConversation(newInput, conversation, payload, "callConversation", function(err, output) {
        if (!err) err = null;
        if (output.session.context.hasOwnProperty('isDialog') && output.session.context.isDialog) {
            output.session.handleJump.storedContext = temp;
        }
        return callback(err, output);
    });
}

function checkChitChat(newInput, conversation, workspace, callback) {
    newInput.debug.handleJump.action = "checkChitChat";
    logChitChatCheck();

    chitchatInput = JSON.parse(JSON.stringify(newInput));

    var payload = {
        workspace_id: workspace,
        input: newInput.input,
        output: {
            actions: []
        }
    };

    callConversation(chitchatInput, conversation, payload, "callChitChat", function(err, output) {
        if (!err) err = null;
        return callback(err, output);
    });
}

function continueWithConversation(resultHolder, oldContext, conversation, workspace, jumpConfig, callback) {
    resultHolder.debug.handleJump.action = "continueWithConversation";

    var previousTopic = resultHolder.session.handleJump.previousTopic;
    if (oldContext && previousTopic && jumpConfig.noBackToTopicIntents.indexOf(previousTopic) === -1) {
        resultHolder.session.context.oldContext = true;
    } else {
        resultHolder.session.context.oldContext = false;
        delete resultHolder.session.handleJump.storedContext;
    }

    var payload = {
        workspace_id: workspace,
        context: resultHolder.session.context,
        output: resultHolder.output,
        input: {
            text: ""
        },
        alternate_intents: config.conversation.show_alternate_intents
    };

    var oldOutput = JSON.parse(JSON.stringify(resultHolder.output));

    callConversation(resultHolder, conversation, payload, "callConversation", function(err, output) {
        if (!err) err = null;
        output.session.handleJump.topIntent = {
            name: output.output.topIntent,
            confidence: output.output.topConfidence
        };

        output.output.topIntent = oldOutput.topIntent;
        output.output.confidence = oldOutput.confidence ? oldOutput.confidence : output.output.confidence;

        return callback(err, output);
    });
}

function restoreOldContext(resultHolder, jumpConfig, conversation, workspace, callback) {
    resultHolder.debug.handleJump.action = "restoreOldContext";
    logRestore();

    var storedContext = resultHolder.session.handleJump.storedContext;

    if (storedContext === undefined) storedContext = resultHolder.session.handleJump.tempStorage;

    var payload = {
        workspace_id: workspace,
        context: storedContext.payloadContext,
        output: {
            answer_id: [],
            actions: []
        },
        input: storedContext.input,
        alternate_intents: config.conversation.show_alternate_intents
    };

    if (storedContext.output.confidence > jumpConfig.businessConfidenceThreshold && jumpConfig.noJumpIntents.indexOf(storedContext.output.topIntent) === -1 && storedContext.output.topIntent != config.conversation.offtopic) {
        payload.context.system = jumpConfig.openingSystemContext;
    }

    callConversation(resultHolder, conversation, payload, "callConversation", function(err, output) {
        if (!err) err = null;

        delete output.session.handleJump.storedContext;
        delete output.session.context.previousTopic;
        if (output.currentContext) delete output.currentContext.previousTopic;

        return callback(err, output);
    });
}

function mergeNewResultWithOldResult(newInput, merger, jumpConfig, callback) {
    newInput.debug.handleJump.action = "mergeNewResultWithOldResult";
    logMergeDwithQA();

    newInput.session.context = merger.session.context;
    if (newInput.currentContext) newInput.currentContext = merger.currentContext;

    newInput.session.handleJump.wasMerged = true;
    newInput.session.handleJump.contextStore.splice(0, 1); //remove the latest input to forget about the merge

    newInput.input = merger.input;
    if (jumpConfig.announceAutoMerge) {
        newInput.output.answer_id = newInput.output.answer_id.concat(['Back_to_topic_automatic']).concat(merger.output.answer_id);
    } else {
        newInput.output.answer_id = newInput.output.answer_id.concat(merger.output.answer_id);
    }
    newInput.output.text = newInput.output.text.concat(merger.output.text);
    newInput.output.nodes_visited = newInput.output.nodes_visited.concat(merger.output.nodes_visited);
    newInput.output.log_messages = newInput.output.log_messages.concat(merger.output.log_messages);
    if (merger.output.actions && newInput.output.actions) {
        newInput.output.actions = newInput.output.actions.concat(merger.output.actions);
    } else if (merger.output.actions) {
        newInput.output.actions = merger.output.actions;
    }

    for (key in merger.output) {
        if (jumpConfig.uncopiedOutputFields.indexOf(key) === -1) {
            newInput.output[key] = merger.output[key];
        }
    }

    newInput.answerFrom = "callConversation";


    return callback(newInput);
}

function mergeNewResultWithChitChat(answersBusiness, answersChitChat, jumpConfig, callback) {
    answersBusiness.debug.handleJump.action = "mergeNewResultWithChitChat";
    logMergeDwithCC();

    if (jumpConfig.announceAutoMerge) answersBusiness.output.answer_id = ['Back_to_topic_automatic'].concat(answersBusiness.output.answer_id);

    if (answersBusiness.output.answer_id.length > 0) answersBusiness.output.answer_id = specifyClientOnAnswerLevel(answersBusiness.output.answer_id, answersBusiness.clientId, answersBusiness.answerFrom);
    if (answersChitChat.output.answer_id.length > 0) answersChitChat.output.answer_id = specifyClientOnAnswerLevel(answersChitChat.output.answer_id, answersChitChat.clientId, answersChitChat.answerFrom);

    answersBusiness.output.answer_id = answersChitChat.output.answer_id.concat(answersBusiness.output.answer_id);
    answersBusiness.output.text = answersChitChat.output.text.concat(answersBusiness.output.text).filter(function(n) {
        return n != ""
    });
    answersBusiness.output.nodes_visited = answersChitChat.output.nodes_visited.concat(answersBusiness.output.nodes_visited);
    answersBusiness.output.log_messages = answersChitChat.output.log_messages.concat(answersBusiness.output.log_messages);
    if (answersChitChat.output.actions && answersBusiness.output.actions) {
        answersBusiness.output.actions = answersChitChat.output.actions.concat(answersBusiness.output.actions);
    } else if (answersChitChat.output.actions) {
        answersBusiness.output.actions = answersChitChat.output.actions;
    }

    for (key in answersChitChat.output) {
        if (jumpConfig.uncopiedOutputFields.indexOf(key) === -1) {
            answersBusiness.output[key] = answersChitChat.output[key];
        }
    }

    answersBusiness.session.handleJump.topIntent = {
        name: answersBusiness.output.topIntent,
        confidence: answersBusiness.output.topConfidence
    };

    answersBusiness.session.context = answersBusiness.session.handleJump.contextStore[1].sessionContext;

    return callback(null, answersBusiness);
}

function continueWithConversationAfterChitChat(chitchatInput, resultHolder, conversation, workspace, jumpConfig, callback) {
    resultHolder.debug.handleJump.action = "continueWithConversationAfterChitChat";
    logCheck();

    resultHolder.session.handleJump.storedContext = resultHolder.session.handleJump.contextStore[1];
    resultHolder.session.handleJump.previousTopic = resultHolder.session.handleJump.contextStore[1].topIntent.name;
    resultHolder.session.context.previousTopic = '${' + resultHolder.session.handleJump.previousTopic + '}';
    if (resultHolder.currentContext) resultHolder.currentContext.previousTopic = resultHolder.session.context.previousTopic;

    resultHolder.session.context.system = jumpConfig.continuationSystemContext;
    resultHolder.session.context.oldContext = true;

    if (chitchatInput.output.answer_id.length > 0) chitchatInput.output.answer_id = specifyClientOnAnswerLevel(chitchatInput.output.answer_id, chitchatInput.clientId, chitchatInput.answerFrom);

    var payload = {
        workspace_id: workspace,
        context: resultHolder.session.context,
        output: {
            answer_id: [],
            actions: []
        },
        input: {
            text: ""
        },
        alternate_intents: config.conversation.show_alternate_intents
    };

    callConversation(resultHolder, conversation, payload, "callConversation", function(err, output) {

        if (err) return callback(err, resultHolder);

        if (output.output.answer_id.length > 0) output.output.answer_id = specifyClientOnAnswerLevel(output.output.answer_id, output.clientId, output.answerFrom);

        output.output.answer_id = chitchatInput.output.answer_id.concat(output.output.answer_id);
        output.output.text = chitchatInput.output.text.concat(output.output.text).filter(function(n) {
            return n != ""
        });
        output.output.nodes_visited = chitchatInput.output.nodes_visited.concat(output.output.nodes_visited);
        output.output.log_messages = chitchatInput.output.log_messages.concat(output.output.log_messages);

        if (output.output.actions && chitchatInput.output.actions) {
            output.output.actions = chitchatInput.output.actions.concat(output.output.actions);
        } else if (answersChitChat.output.actions) {
            output.output.actions = chitchatInput.output.actions;
        }

        for (key in chitchatInput.output) {
            if (jumpConfig.uncopiedOutputFields.indexOf(key) === -1) {
                output.output[key] = chitchatInput.output[key];
            }
        }

        output.session.handleJump.topIntent = {
            name: output.output.topIntent,
            confidence: output.output.topConfidence
        };

        return callback(err, output);
    });
}

function continueWithConversationNonDialog(resultHolder, conversation, workspace, systemContext, callback) {
    resultHolder.debug.handleJump.action = "continueWithConversationNonDialog";
    logCheck();

    resultHolder.session.handleJump.previousTopic = resultHolder.session.handleJump.contextStore[1].topIntent.name;
    resultHolder.session.context.previousTopic = '${' + resultHolder.session.handleJump.previousTopic + '}';
    if (resultHolder.currentContext) resultHolder.currentContext.previousTopic = resultHolder.session.context.previousTopic;

    resultHolder.session.context.system = systemContext;
    resultHolder.session.context.oldContext = true;

    var payload = {
        workspace_id: workspace,
        context: resultHolder.session.context,
        output: {
            answer_id: [],
            actions: []
        },
        input: {
            text: ""
        },
        alternate_intents: config.conversation.show_alternate_intents
    };

    var merger = JSON.parse(JSON.stringify(resultHolder));

    callConversation(resultHolder, conversation, payload, "callConversation", function(err, output) {
        if (!err) err = null;
        output.output.answer_id = merger.output.answer_id.concat(output.output.answer_id);
        output.output.text = merger.output.text.concat(output.output.text).filter(function(n) {
            return n != ""
        });
        output.output.nodes_visited = merger.output.nodes_visited.concat(output.output.nodes_visited);
        output.output.log_messages = merger.output.log_messages.concat(output.output.log_messages);
        return callback(err, output);
    });
}

function callConversation(resultHolder, conversation, payload, answerFrom, callback) {
    if (payload.hasOwnProperty('context')) {
        payload.context.confidence_threshold = (config.chitchat && config.chitchat.wcs_confidence_level) ? config.chitchat.wcs_confidence_level : 0.7;
        payload.context.calledByJumpHandler = true;
    } else {
        payload.context = {
            confidence_threshold: (config.chitchat && config.chitchat.wcs_confidence_level) ? config.chitchat.wcs_confidence_level : 0.7,
            calledByJumpHandler: true
        }
    }

    conversation.message(payload, function(err, data) {
        delete data.context.calledByJumpHandler;

        resultHolder.debug.handleJump.data = data;
        resultHolder.debug.totalWcsCalls++;

        if (err) return callback(err, resultHolder);

        resultHolder.output = JSON.parse(JSON.stringify(data.output));

        var replacablePrompts = [];

        for (var i = 0; i < resultHolder.output.text.length; i++) {
            if (resultHolder.output.text[i] == "%%promptPlaceholder%%") {
                replacablePrompts.push(i);
            }
        }

        resultHolder.session.context = data.context;
        if (resultHolder.currentContext) resultHolder.currentContext = data.context;

        async.forEach(replacablePrompts, function(prompt, cb) {
            payload.input.text = "";
            payload.context = resultHolder.session.context;
            conversation.message(payload, function(err, data) {
                resultHolder.debug.handleJump.data = data;
                resultHolder.debug.totalWcsCalls++;
                if (err) {
                    cb(err);
                }
                var output = JSON.parse(JSON.stringify(data.output));
                resultHolder.output.text = resultHolder.output.text.slice(0, prompt).concat(output.text).concat(resultHolder.output.text.slice(prompt + 1));
                resultHolder.output.answer_id = resultHolder.output.answer_id.slice(0, prompt).concat(output.answer_id).concat(resultHolder.output.answer_id.slice(prompt));
                resultHolder.session.context = data.context;
                if (resultHolder.currentContext) resultHolder.currentContext = data.context;
                cb();
            });
        }, function(err) {
            if (!err) {
                err = null;
                resultHolder.debug.handleJump.success = true;
            }
            resultHolder.answerFrom = answerFrom;
            resultHolder.session.conversationId = data.context.conversation_id;
            resultHolder.output.topIntent = data.intents[0] ? data.context.topIntent : undefined;
            resultHolder.output.confidence = data.intents[0] ? data.context.topConfidence : 0.0;
            return callback(err, resultHolder);
        });
    });
}

function purgeOldContext(resultHolder, callback) {
    resultHolder.debug.handleJump.action = "purgeOldContext";
    logPurge();

    var topIntent = JSON.parse(JSON.stringify(resultHolder.session.handleJump.topIntent));
    var contextStore = JSON.parse(JSON.stringify(resultHolder.session.handleJump.contextStore));
    delete resultHolder.session.handleJump;
    resultHolder.session.handleJump = {
        topIntent: topIntent,
        contextStore: contextStore
    }

    delete resultHolder.session.context.previousTopic;
    if (resultHolder.currentContext) delete resultHolder.currentContext.previousTopic;

    return callback(null, resultHolder);
}

function specifyClientOnAnswerLevel(answerIds, clientId, answerFrom) {
    let objectArray = [];

    for (var i = 0; i < answerIds.length; i++) {
        objectArray.push({
            id: answerIds[i],
            clientId: clientId,
            answerFrom: answerFrom
        });
    }

    return objectArray;
}

function storeTopIntent(resultHolder) {
    resultHolder.session.handleJump.topIntent = {
        name: resultHolder.output.topIntent,
        confidence: resultHolder.output.confidence
    };
    return resultHolder;
}

function getTopIntentFromSession(resultHolder) {
    if (resultHolder.session.hasOwnProperty('handleJump')) return resultHolder.session.handleJump.topIntent ? resultHolder.session.handleJump.topIntent : undefined;
    return undefined;
}

function manageContextStore(resultHolder) {
    var contextStore = resultHolder.session.handleJump.contextStore;

    contextStore.unshift({
        payloadContext: cloneElement(resultHolder.payload.context),
        sessionContext: cloneElement(resultHolder.session.context),
        topIntent: cloneElement(resultHolder.session.handleJump.topIntent),
        wasMerged: cloneElement(resultHolder.session.handleJump.wasMerged),
        answerFrom: cloneElement(resultHolder.answerFrom),
        input: cloneElement(resultHolder.input),
        output: cloneElement(resultHolder.output),
        actions: cloneElement(resultHolder.output.actions)
    });

    if (contextStore.length > 3) {
        contextStore.pop();
    }

    return contextStore;
}

function cloneElement(element) {
    return (element ? JSON.parse(JSON.stringify(element)) : null);
}

function mockOldInput(resultHolder) {
    return {
        session: {
            context: resultHolder.session.handleJump.contextStore[0].sessionContext,
            handleJump: {
                topIntent: resultHolder.session.handleJump.contextStore[1].topIntent,
                wasMerged: resultHolder.session.handleJump.contextStore[0].wasMerged
            }
        },
        input: resultHolder.session.handleJump.contextStore[0].input,
        output: {
            actions: resultHolder.session.handleJump.contextStore[1].actions
        },
        answerFrom: resultHolder.session.handleJump.contextStore[1].answerFrom
    }
}

function createPreviousTopic(newInput, oldInput, jumpConfig) {
    if (oldInput === undefined) return newInput;

    var oldTopIntent = getTopIntentFromSession(oldInput);
    var newTopIntent = getTopIntentFromSession(newInput);

    if (!newInput.session.handleJump.hasOwnProperty('previousTopic') && oldTopIntent && !oldInput.session.handleJump.wasMerged && jumpConfig.noJumpIntents.indexOf(newTopIntent.name) === -1 && (jumpConfig.enableSameIntentJumps || newTopIntent.name != oldTopIntent.name) && oldInput.answerFrom !== "callChitChat" && oldInput.output.actions.indexOf('deadEnd') === -1) {
        newInput.session.handleJump.previousTopic = oldTopIntent.name;
    }

    return newInput;
}

function evaluateJumpConditions(newInput, oldInput, jumpConfig) {
    if (oldInput === undefined) return false;

    var newContext = newInput.session.context;

    var oldTopIntent = getTopIntentFromSession(oldInput);
    var newTopIntent = getTopIntentFromSession(newInput);

    if (newInput.answerFrom !== "callChitChat" && newContext.isDialog && ((newInput.input.text && newInput.input.text.split(' ').length > 2) || (jumpConfig.fewWordIntents.indexOf(newTopIntent.name) !== -1) && newTopIntent.confidence >= jumpConfig.functionalConfidenceThreshold) && !oldInput.session.context.system.hasOwnProperty('branch_exited')) {
        if (newInput.output.actions && newInput.output.actions.indexOf("preventJump") === -1 && oldInput.output.actions.indexOf('callFindQuestions') === -1 && oldInput.answerFrom !== "callChitChat") {
            if (newInput.session.handleJump.previousTopic && (jumpConfig.enableSameIntentJumps || newTopIntent.name != newInput.session.handleJump.previousTopic)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function getConfig() {
    var jumpConfig = {};

    if (config.hasOwnProperty('jumpHandling')) {
        if (config.jumpHandling.enabled) {
            jumpConfig.enabled = true;
            jumpConfig.default = getBehavior('default');
            jumpConfig.dialog2qa = getBehavior('dialog2qa');
            jumpConfig.dialog2chitchat = getBehavior('dialog2chitchat');
            jumpConfig.dialog2dialog = getBehavior('dialog2dialog');
            jumpConfig.businessConfidenceThreshold = getConfidenceThreshold('min', 'businessConfidenceThreshold');
            jumpConfig.chitchatConfidenceThreshold = getConfidenceThreshold('min', 'chitchatConfidenceThreshold');
            jumpConfig.switchWorkspaceThreshold = getConfidenceThreshold('max', 'switchWorkspaceThreshold');
            if (config.jumpHandling.hasOwnProperty('openingSystemContext') && config.jumpHandling.hasOwnProperty('continuationSystemContext')) {
                jumpConfig.openingSystemContext = config.jumpHandling.openingSystemContext;
                jumpConfig.continuationSystemContext = config.jumpHandling.continuationSystemContext;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('persistentContextVars')) {
                jumpConfig.persistentContextVars = config.jumpHandling.persistentContextVars;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('noJumpIntents')) {
                jumpConfig.noJumpIntents = config.jumpHandling.noJumpIntents;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('noBackToTopicIntents')) {
                jumpConfig.noBackToTopicIntents = config.jumpHandling.noBackToTopicIntents;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('fewWordIntents')) {
                jumpConfig.fewWordIntents = config.jumpHandling.fewWordIntents;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('announceAutoMerge')) {
                jumpConfig.announceAutoMerge = config.jumpHandling.announceAutoMerge;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('enableSameIntentJumps')) {
                jumpConfig.enableSameIntentJumps = config.jumpHandling.enableSameIntentJumps;
            } else {
                jumpConfig.enabled = false;
            }
            if (config.jumpHandling.hasOwnProperty('uncopiedOutputFields')) {
                jumpConfig.uncopiedOutputFields = config.jumpHandling.uncopiedOutputFields;
            } else {
                jumpConfig.enabled = false;
            }
        } else {
            jumpConfig.enabled = false;
        }
    } else {
        jumpConfig.enabled = false;
    }

    return jumpConfig;
}

function getBehavior(relation) {
    if (config.jumpHandling.hasOwnProperty(relation)) {
        if (config.jumpHandling[relation] == "blocked" || config.jumpHandling[relation] == "automatic" || config.jumpHandling[relation] == "prompt") {
            return config.jumpHandling[relation];
        } else {
            if (config.jumpHandling.hasOwnProperty('default')) {
                return config.jumpHandling.default;
            } else {
                return "blocked";
            }
        }
    }
}

function getConfidenceThreshold(comparison, threshold) {
    if (config.jumpHandling.hasOwnProperty(threshold) && config.jumpHandling[threshold] >= 0 && config.jumpHandling[threshold] <= 1) {
        return config.jumpHandling[threshold];
    } else {
        if (comparison == 'min') {
            return 1;
        } else if (comparison == 'max') {
            return 0;
        } else {
            return null;
        }
    }
}

function handleError(err, resultHolder, callback) {
    resultHolder.session.context = resultHolder.session.handleJump.contextStore[0].sessionContext;
    resultHolder.payload.context = resultHolder.session.handleJump.contextStore[0].payloadContext;
    resultHolder.output = resultHolder.session.handleJump.contextStore[0].output;
    resultHolder.input = resultHolder.session.handleJump.contextStore[0].input;

    if (typeof err === 'object' && err !== null) err = JSON.stringify(err);

    let warning = "ERROR occurred during jumpHandling, returning input resutHolder! Caused by: " + err;
    return callback(warning, resultHolder);
}

function debugConditions(newInput, oldInput, jumpConfig) {
    var newTopIntent = getTopIntentFromSession(newInput);
    var newContext = newInput.session.context;

    var conditions = [];

    if (newInput.output.actions.indexOf("checkForOldContext") !== -1) {
        conditions.push({
            condition: "newInput.output.actions.indexOf('checkForOldContext') === -1",
            value: newInput.output.actions.indexOf("checkForOldContext"),
            message: "newInput.output.actions contains checkForOldContext."
        });
    }

    if (newInput.output.actions.indexOf('restoreOldContext') !== -1) {
        conditions.push({
            condition: "newInput.output.actions.indexOf('restoreOldContext') === -1",
            value: newInput.output.actions.indexOf('restoreOldContext'),
            message: "newInput.output.actions contains restoreOldContext."
        });
    }

    if (newInput.output.actions.indexOf('purgeOldContext') !== -1) {
        conditions.push({
            condition: "newInput.output.actions.indexOf('purgeOldContext') === -1",
            value: newInput.output.actions.indexOf('purgeOldContext'),
            message: "newInput.output.actions contains purgeOldContext."
        });
    }

    if (newInput.answerFrom === "callChitChat") {
        conditions.push({
            condition: "newInput.answerFrom !== 'callChitChat'",
            value: newInput.answerFrom !== "callChitChat",
            message: "newInput.answerFrom equals callChitChat."
        });
    }

    if (!newContext.isDialog) {
        conditions.push({
            condition: "newContext.isDialog",
            value: newContext.isDialog,
            message: "newContext.isDialog evaluates to false."
        });
    }

    if (!((newInput.input.text && newInput.input.text.split(' ').length > 2) || (jumpConfig.fewWordIntents.indexOf(newTopIntent.name) !== -1)&& newTopIntent.confidence >= jumpConfig.functionalConfidenceThreshold)) {
        if (newInput.input.text && newInput.input.text.split(' ').length <= 2) {
            conditions.push({
                condition: "newInput.input.text.split(' ').length > 2",
                value: newInput.input.text.split(' ').length > 2,
                message: "Input length is less than or equal to 2."
            });
        }

        if (jumpConfig.fewWordIntents.indexOf(newTopIntent.name) === -1) {
            conditions.push({
                condition: "jumpConfig.fewWordIntents.indexOf(newTopIntent.name) !== -1",
                value: jumpConfig.fewWordIntents.indexOf(newTopIntent.name),
                message: "newTopIntent is not a few word intent."
            });
        }

        if (newTopIntent.confidence < jumpConfig.functionalConfidenceThreshold) {
            conditions.push({
                condition: "(newTopIntent.confidence > jumpConfig.functionalConfidenceThreshold)",
                value: newTopIntent.confidence > jumpConfig.functionalConfidenceThreshold,
                message: "if newTopIntent is a few word intent, its confidence is too low"
            });
        }
    }

    if (oldInput && oldInput.session.context.system && oldInput.session.context.system.hasOwnProperty('branch_exited')) {
        conditions.push({
            condition: "!oldInput.session.context.system.hasOwnProperty('branch_exited')",
            value: !oldInput.session.context.system.hasOwnProperty('branch_exited'),
            message: "oldInput.session.context.system has own property 'branch_exited'."
        });
    }

    if (newInput.output.actions && newInput.output.actions.indexOf("preventJump") !== -1) {
        conditions.push({
            condition: "newInput.output.actions.indexOf('preventJump') === -1",
            value: newInput.output.actions.indexOf('preventJump'),
            message: "newInput.output.actions contains preventJump."
        });
    }

    if (oldInput && oldInput.output.actions.indexOf('callFindQuestions') !== -1) {
        conditions.push({
            condition: "oldInput.output.actions.indexOf('callFindQuestions') === -1",
            value: oldInput.output.actions.indexOf('callFindQuestions'),
            message: "oldInput.output.actions contains callFindQuestions."
        });
    }

    if (oldInput && oldInput.answerFrom !== "callChitChat") {
        conditions.push({
            condition: "oldInput.answerFrom !== 'callChitChat'",
            value: oldInput.answerFrom,
            message: "oldInput.answerFrom equals callChitChat."
        });
    }

    if (!newInput.session.handleJump.previousTopic) {
        conditions.push({
            condition: "newInput.session.handleJump.previousTopic",
            value: newInput.session.handleJump.previousTopic || null,
            message: "newInput.session.handleJump.previousTopic is null or undefined."
        });
    }

    if (!(jumpConfig.enableSameIntentJumps || newTopIntent.name != newInput.session.handleJump.previousTopic)) {
        if (!jumpConfig.enableSameIntentJumps) {
            conditions.push({
                condition: "jumpConfig.enableSameIntentJumps",
                value: jumpConfig.enableSameIntentJumps,
                message: "jumpConfig.enableSameIntentJumps evaluates to false."
            });
        }

        if (newTopIntent.name === newInput.session.handleJump.previousTopic) {
            conditions.push({
                condition: "newTopIntent.name !== newInput.session.handleJump.previousTopic",
                value: newTopIntent.name !== newInput.session.handleJump.previousTopic,
                message: "newTopIntent.name equals newInput.session.handleJump.previousTopic."
            });
        }
    }

    if (jumpConfig.noJumpIntents.indexOf(newTopIntent.name) !== -1) {
        conditions.push({
            condition: "jumpConfig.noJumpIntents.indexOf(newTopIntent.name) !== -1",
            value: jumpConfig.noJumpIntents.indexOf(newTopIntent.name),
            message: "intent is not intended to jump"
        });
    }

    var lastConditions1 = [];
    if (!(newTopIntent.confidence > jumpConfig.businessConfidenceThreshold && newTopIntent.name !== config.conversation.offtopic)) {
        if (newTopIntent.confidence <= jumpConfig.businessConfidenceThreshold) {
            lastConditions1.push({
                condition: "newTopIntent.confidence > jumpConfig.businessConfidenceThreshold",
                value: newTopIntent.confidence > jumpConfig.businessConfidenceThreshold,
                message: "newTopIntent.confidence is less than or equal to " + jumpConfig.businessConfidenceThreshold + "."
            });
        }

        if (newTopIntent.name === config.conversation.offtopic) {
            lastConditions1.push({
                condition: "newTopIntent.name !== config.conversation.offtopic",
                value: newTopIntent.name !== config.conversation.offtopic,
                message: "newTopIntent.name equals config.conversation.offtopic."
            });
        }
    }

    var lastConditions2 = [];
    if (!(newTopIntent.confidence < jumpConfig.switchWorkspaceThreshold || (newTopIntent.name === config.conversation.offtopic))) {
        if (newTopIntent.confidence >= jumpConfig.businessConfidenceThreshold) {
            lastConditions2.push({
                condition: "newTopIntent.confidence < jumpConfig.businessConfidenceThreshold",
                value: newTopIntent.confidence < jumpConfig.businessConfidenceThreshold,
                message: "newTopIntent.confidence is greater than or equal to " + jumpConfig.businessConfidenceThreshold + "."
            });
        }

        if (newTopIntent.name !== config.conversation.offtopic) {
            lastConditions2.push({
                condition: "newTopIntent.name === config.conversation.offtopic",
                value: newTopIntent.name === config.conversation.offtopic,
                message: "newTopIntent.name is unequal to config.conversation.offtopic."
            });
        }
    }

    if (conditions.length > 0) {
        if (lastConditions1.length > 0 && lastConditions2.length > 0) {
            conditions.concat(lastConditions1).concat(lastConditions2);
        }
        if (lastConditions1.length > 0 && lastConditions2.length == 0) {
            conditions.concat(lastConditions1);
        }
        if (lastConditions1.length == 0 && lastConditions2.length > 0) {
            conditions.concat(lastConditions2);
        }
    } else {
        if (lastConditions1.length > 0 && lastConditions2.length > 0) {
            conditions.concat(lastConditions1).concat(lastConditions2);
        }
    }

    if (conditions.length > 0) {
        newInput.debug.handleJump.conditions = conditions;
    }

    return newInput;
}

function logJump() {
    console.log('');
    console.log('##########################################');
    console.log('######        JUMP JUMP JUMP        ######');
    console.log('##########################################');
    console.log('');
}

function logCheck() {
    console.log('');
    console.log('##########################################');
    console.log('######     DO U WANT 2 RESTORE?     ######');
    console.log('##########################################');
    console.log('');
}

function logRestore() {
    console.log('');
    console.log('##########################################');
    console.log('######     RESTORE OLD CONTEXT!     ######');
    console.log('##########################################');
    console.log('');
}

function logPurge() {
    console.log('');
    console.log('##########################################');
    console.log('######      PURGE OLD CONTEXT!      ######');
    console.log('##########################################');
    console.log('');
}

function logMergeDwithQA() {
    console.log('');
    console.log('##########################################');
    console.log('######      !MERGE D WITH QA!       ######');
    console.log('##########################################');
    console.log('');
}

function logMergeDwithCC() {
    console.log('');
    console.log('##########################################');
    console.log('######      !MERGE D WITH CC!       ######');
    console.log('##########################################');
    console.log('');
}

function logChitChatCheck() {
    console.log('');
    console.log('##########################################');
    console.log('######       CHECK CHIT CHAT!       ######');
    console.log('##########################################');
    console.log('');
}
