/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

const db = require('../db/db.js').getDatabase();
const answerStoreConfig = require('../../../../helper/config.js').getConfig('answerStore');
const chitchatConfig = require('../../../../helper/config.js').getConfig('chitchat');

const validAnswerPropertyTypes = {
    number: 'number',
    multipleChoice: 'multipleChoice'
};

exports.getAnswerOption = function(user, clientId, answerId, context, callbackSuccess, callbackError) {

    getAnswerContainer(user, clientId).then(containerName => {
        db.getAnswer(containerName, answerId).then(answer => {
            if (answer === null || answer === undefined) {
                callbackSuccess('could_not_find_answer_with_id: ' + answerId, answer);
            } else if (!Array.isArray(answer.answerOptions) || answer.answerOptions.length === 0) {
                callbackSuccess('no_answer_options_for_answer_with_id: ' + answerId, null);
            } else {
                callbackSuccess(null, selectAnswerOptionFromAnswer(answer, context));
            }
        }, error => callbackError(error.status || 500, error.message));
    }, error => callbackError(error.status || 500, error.message));
};

exports.findAnswerSet = function(user, clientId) {
    const answerSets = getAnswerSetsInternal(user);

    const foundSet = answerSets.find(answerSet => answerSet.id === clientId);
    if (foundSet == null) return null;
    return foundSet.database;
};

function getAnswerContainer(user, clientId) {
    return new Promise((resolve, reject) => {
        const answerSets = getAnswerSetsInternal(user);
        const foundSet = answerSets.find(answerSet => answerSet.id === clientId);
        if (foundSet === undefined) {
            return reject({
                status: 400,
                message: 'no answer container available for this client'
            });
        }
        return resolve(foundSet.database);
    });
}

function getAnswerSetsInternal(user) {
    let additionalAnswerSets = [];

    if (chitchatConfig && typeof chitchatConfig.answers_db === 'string') {
        additionalAnswerSets.push({
            id: 'virtual_chitchat',
            name: 'Virtual ChitChat',
            database: chitchatConfig.answers_db
        });
    }

    const clients = user.clients;
    const clientAnswerSets = [];
    if (Array.isArray(clients)) {
        clients.forEach(client => {
            if (client.hasOwnProperty('business_answers_db') && client.business_answers_db.trim() !== '') {
                clientAnswerSets.push({
                    id: client.id,
                    name: client.name,
                    database: client.business_answers_db
                });
            }

            if (client.hasOwnProperty('chitchat_answers_db') && client.chitchat_answers_db.trim() !== '') {
                clientAnswerSets.push({
                    id: client.id + '_chitchat',
                    name: client.name + ' - Chitchat',
                    database: client.chitchat_answers_db
                });
            }

        });
    }
    return clientAnswerSets.concat(additionalAnswerSets);
}

function selectAnswerOptionFromAnswer(answer, context) {
    // calculate distance measures for all answer options
    let minDistanceAnswerOptions = [{
        distance: Number.POSITIVE_INFINITY
    }];

    for (const answerOption of answer.answerOptions) {
        answerOption.distance = 0;

        // step through every valid answer property and compute the distance, if the property exists
        for (const answerProperty of answerStoreConfig.answerProperties) {
            if (context.hasOwnProperty(answerProperty.name) && answerOption.properties.hasOwnProperty(answerProperty.name)) {
                const contextValue = context[answerProperty.name];
                const answerOptionValue = answerOption.properties[answerProperty.name];

                // different distance values for the answer property types
                // first check if values are null or undefined
                if (contextValue == null || answerOptionValue == null) {
                    break;
                } else if (answerProperty.type === validAnswerPropertyTypes.number) {
                    answerOption.distance += Math.abs(contextValue - answerOptionValue);
                } else if (answerProperty.type === validAnswerPropertyTypes.multipleChoice) {
                    if (contextValue !== answerOptionValue) {
                        answerOption.distance += Math.abs(answerStoreConfig.multipleChoiceDistanceMeasure);
                    }
                }
            }
        }

        // save minimum distance answer options
        if (minDistanceAnswerOptions[0].distance > answerOption.distance) {
            minDistanceAnswerOptions = [answerOption];
        } else if (minDistanceAnswerOptions[0].distance === answerOption.distance) {
            minDistanceAnswerOptions.push(answerOption);
        }
    }

    // select a random answer from the minDistanceAnswerOptions
    const selectedAnswerOption = minDistanceAnswerOptions[Math.floor(Math.random() * minDistanceAnswerOptions.length)];

    let selectedAnswerProposals = [];
    if (Array.isArray(answer.answerProposals)) {
        selectedAnswerProposals = answer.answerProposals;
    }
    if (Array.isArray(selectedAnswerOption.additionalAnswerProposals)) {
        selectedAnswerProposals = selectedAnswerProposals.concat(selectedAnswerOption.additionalAnswerProposals);
    }

    // return the answerText of the minimum distance answer option
    return {
        answerText: selectedAnswerOption.answerText,
        answerProposals: selectedAnswerProposals,
        answerId: answer.answerId
    };
}

function validateAnswerProperty(property, callingFunctionString) {
    const result = jsonValidator.validate('eva-answer-store-answer-property', property);
    if (!result) {
        console.log('Error validating an answer in ', callingFunctionString);
        console.log(jsonValidator.errors);
    }
    return result;
}
