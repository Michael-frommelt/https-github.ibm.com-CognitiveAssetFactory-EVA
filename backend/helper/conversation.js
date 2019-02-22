/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

var clients = require('./clients.js');
var watson = require('watson-developer-cloud');
var config = require('./config.js').getConfig('general');
var chitchatConfig = require('./config.js').getConfig('chitchat');
var conversationConfig = require('./config.js').getConfig('conversation');
var testingConfig = require('./config.js').getConfig('testing');

const ERROR_INSUFFICIENT_CREDENTIALS = 'Conversation configuration could not be found or is not sufficient.';
const ERROR_NO_WORKSPACE_SPECIFIED = 'No workspace found for specified client.'
const ERROR_NO_CONVERSATION_IN_TESTING = 'Testing config does not provide any conversation specification.';
const ERROR_NO_TEST_WORKSPACES_SPECIFIED = 'Testing config does not provide any conversation workspaces.';
const ERROR_NO_TEST_WORKSPACE_FOR_TESTTYPE = 'Testing config does not provide a workspace id for the test type specified.';
const ERROR_UNKNOWN_CONVERSATION_TYPE = 'The provided conversation type is unknown. Giving up!';
const ERROR_OWN_CREDENTIALS_NO_CHITCHAT = 'The client provides its own conversation credentials but doesn not have a chitchat workspace specified.';

const BUSINESS = 'business';
const CHITCHAT = 'chitchat';

exports.getBusinessConversationSetup = function(clientId, user, test) {
    return getConversationSetup(clientId, user, test, BUSINESS);
}

exports.getChitChatConversationSetup = function(clientId, user, test) {
    return getConversationSetup(clientId, user, test, CHITCHAT);
}

function getConversationSetup(clientId, user, test, type) {

    if (!test) {

        var client;
        if (user) {
            client = clients.findClientByIdInUser(user, clientId);
        } else {
            client = clients.findClientById(clientId);
        }

        var conversation_credentials, workspace;
        if (client.hasOwnProperty('conversation')) {
            if (client.conversation.url && client.conversation.api_key && client.conversation.version_date && client.conversation.version) {
                if (config && config.backendLogLevel && config.backendLogLevel >= 3) {
                    console.log("Client is using its own credentials for WCS.");
                }

                conversation_credentials = {
                    url: client.conversation.url,
                    iam_apikey: client.conversation.api_key,
                    version_date: client.conversation.version_date,
                    version: client.conversation.version
                };

                workspace = getWorkspaceForType(client, type, true);

            } else {
                throw new Error(ERROR_INSUFFICIENT_CREDENTIALS);
            }

        } else {

            if (type === BUSINESS) {

                if (conversationConfig.url && conversationConfig.api_key && conversationConfig.version_date && conversationConfig.version) {
                    conversation_credentials = {
                        url: conversationConfig.url,
                        iam_apikey: conversationConfig.api_key,
                        version_date: conversationConfig.version_date,
                        version: conversationConfig.version
                    };
                } else {
                    throw new Error(ERROR_INSUFFICIENT_CREDENTIALS);
                }

                workspace = getWorkspaceForType(client, type, false);

            } else if (type === CHITCHAT) {

                if (chitchatConfig.url && chitchatConfig.api_key && chitchatConfig.version_date && chitchatConfig.version) {
                    conversation_credentials = {
                        url: chitchatConfig.url,
                        iam_apikey: chitchatConfig.api_key,
                        version_date: chitchatConfig.version_date,
                        version: chitchatConfig.version
                    };
                } else {
                    throw new Error(ERROR_INSUFFICIENT_CREDENTIALS);
                }

                workspace = getWorkspaceForType(client, type, false);

            } else {
                throw new Error(ERROR_UNKNOWN_CONVERSATION_TYPE);
            }
        }

        // add learning opt out to conversation configuration
        conversation_credentials.headers = {
            'X-Watson-Learning-Opt-Out': true
        };

        var service = watson.conversation(conversation_credentials);

        return ({
            service: service,
            workspace: workspace
        });

    } else {

        return getTestingConversationSetup("dialog", type);

    }
}

exports.getTestingBusinessConversationSetup = function(type) {
    return getTestingConversationSetup(type, BUSINESS);
}

exports.getTestingChitChatConversationSetup = function(type) {
    return getTestingConversationSetup(type, CHITCHAT);
}

function getTestingConversationSetup(testtype, conversationtype) {
    if (!testingConfig.hasOwnProperty('conversation')) throw new Error(ERROR_NO_CONVERSATION_IN_TESTING);
    if (!testingConfig.conversation.hasOwnProperty('workspaces')) throw new Error(ERROR_NO_TEST_WORKSPACES_SPECIFIED);

    var property;
    if (testtype === "dialog") {
        property = testtype + '_' + conversationtype;
    } else {
        property = testtype;
    }

    if (testingConfig.conversation.workspaces.hasOwnProperty(property)) {

        var conversation_credentials;
        if (testingConfig.conversation.url && testingConfig.conversation.api_key && testingConfig.conversation.version_date && testingConfig.conversation.version) {
            conversation_credentials = {
                url: testingConfig.conversation.url,
                iam_apikey: testingConfig.conversation.api_key,
                version_date: testingConfig.conversation.version_date,
                version: testingConfig.conversation.version
            };
        } else {
            throw new Error(ERROR_INSUFFICIENT_CREDENTIALS);
        }

        var service = watson.conversation(conversation_credentials);

        var workspace = validateWorkspace(testingConfig.conversation.workspaces[property]);

        return ({
            service: service,
            workspace: workspace
        });

    } else {
        throw new Error(ERROR_NO_TEST_WORKSPACE_FOR_TESTTYPE);
    }
}

function getWorkspaceForType(client, type, own_credentials) {

    if (type === BUSINESS) {
        return validateWorkspace(client[type + '_workspace']);
    } else if (type === CHITCHAT) {
        var workspace = client[type + '_workspace'];

        if (own_credentials) {
            if (workspace) {
                return validateWorkspace(workspace);
            } else {
                throw new Error(ERROR_OWN_CREDENTIALS_NO_CHITCHAT);
            }
        } else {
            if (workspace) {
                return validateWorkspace(workspace);
            } else {
                return validateWorkspace(chitchatConfig.workspace);
            }
        }
    } else {
        throw new Error(ERROR_UNKNOWN_CONVERSATION_TYPE);
    }
}

function validateWorkspace(workspaceId) {
    if (!workspaceId || workspaceId === '<workspace-id>') {
        throw new Error(ERROR_NO_WORKSPACE_SPECIFIED);
    }
    return workspaceId;
}
