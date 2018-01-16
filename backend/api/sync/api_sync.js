/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

// ##############################
// ## IMPORTS                  ##
// ##############################
const answerApi = require('../answers/api_answers.js');
const permissions = require('../../helper/permissions.js');
const variableApi = require('../variable/api_variable.js');

var conversationConfig = require('../../helper/config.js').getConfig('conversation');
var service = require('../../helper/conversation.js');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    app.get('/api/sync/answerids/:clientId', permissions.mwHasPermission('editSettings'), this.answerIdDifference);
    app.get('/api/sync/variables/:clientId', permissions.mwHasPermission('editSettings'), this.variablesDifference);
};

// ##############################
// ## ROUTES                   ##
// ##############################
exports.answerIdDifference = function(req, res) {
    var user = req.user;
    var clientId = req.params.clientId;

    if (user && clientId) {
        var source;
        try {
            source = service.getBusinessConversationSetup(clientId, user);
        } catch (err) {
            return res.status(500).json('Invalid parameters.');
        }

        // TODO replace this with listDialogNodes, when the corresponding Watson SDK API call is released
        const conversationWorkspacePromise = new Promise((resolve, reject) => {
            source.service.getWorkspace({
                workspace_id: source.workspace,
                export: true
            }, (error, response) => {
                if (error) {
                    return reject(error);
                }
                return resolve(response);
            });
        }).then(conversationWorkspace => {
            // extract answerIds out of workspace
            return conversationWorkspace.dialog_nodes.reduce((result, dialogNode) => {
                let answerId = dialogNode.output ? dialogNode.output.answer_id : null;
                if (!answerId) {
                    return result;
                }

                // handle array inputs
                if (Array.isArray(answerId)) {
                    if (answerId.length == 0) {
                        return result;
                    } else {
                        answerId = answerId[0];
                    }
                }

                // if the answerId is not a string, convert it to one
                if (typeof answerId !== 'string') {
                    answerId = answerId.toString();
                }

                // if the value contains one or multiple strings (identified by quotes), parse it as the answerId and remove the quotes from the match
                const matches = answerId.match(/('.*?'|".*?")/g);
                if (Array.isArray(matches)) {
                    matches.forEach((match) => {
                        result.push(match.substring(1, match.length - 1));
                    });
                }
                return result;
            }, []);
        });

        // Get all answers
        const answerStorePromise = answerApi.getAnswersInternal(req.user, req.params.clientId, null).then(
            answers => answers.map(answer => answer.answerId)
        );

        Promise.all([conversationWorkspacePromise, answerStorePromise]).then(([wcsAnswerIds, answerStoreAnswerIds]) => {
            const wcsSet = new Set(wcsAnswerIds);
            const answerStoreSet = new Set(answerStoreAnswerIds);

            res.json({
                idsOnlyInAnswerStore: Array.from(answerStoreSet).filter(answerStoreAnswerId => !wcsSet.has(answerStoreAnswerId)),
                idsOnlyInWCS: Array.from(wcsSet).filter(wcsAnswerId => !answerStoreSet.has(wcsAnswerId))
            });
        }, error => res.status(error.status || 500).send(error.message));
    } else {
        return res.status(401).send('Invalid parameters.');
    }
};

exports.variablesDifference = function(req, res) {
    // Get all variableNames from answerTexts
    const answerStorePromise = answerApi.getAnswersInternal(req.user, req.params.clientId, null).then(
        answers => answers.reduce((result, answer) => {
            for (const answerOption of answer.answerOptions) {
                // match answerText for ${any_word}; which are variables
                const variableNames = answerOption.answerText.match(/\${.*?}/g);
                if (!variableNames) {
                    continue;
                }

                // remove the inserting syntax from the variable name;
                result = result.concat(variableNames.map(variableName => variableName.substring(2, variableName.length - 1)));
            }
            return result;
        }, [])
    );

    // get all variableNames from the variableApi
    const variableApiPromise = variableApi.getVariablesInternal(null).then(variables => variables.map(variable => variable.name));

    Promise.all([answerStorePromise, variableApiPromise]).then(([answerStoreVariableNames, variableApiVariableNames]) => {
        const answerStoreSet = new Set(answerStoreVariableNames);
        const variableApiSet = new Set(variableApiVariableNames);

        res.json({
            variablesOnlyInAnswerStore: Array.from(answerStoreSet).filter(answerStoreVariableName => !variableApiSet.has(answerStoreVariableName)),
            variablesOnlyInVariableApi: Array.from(variableApiSet).filter(variableApiVariableName => !answerStoreSet.has(variableApiVariableName))
        });
    }, error => res.status(error.status || 500).send(error.message));
};
