/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var async = require('async');
var answerUtil = require('./src/util.js');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.loadLongAnswer = {
        answer_id: []
    };

    if (resultHolder.output.answer_id && resultHolder.output.answer_id.length > 0) {

        if (resultHolder.session.jargon === undefined) {
            resultHolder.session.jargon = "formell";
        }

        var context = {
            jargon: resultHolder.session.jargon,
            sentiment: resultHolder.session.sentiment
        };

        let clientId = resultHolder.clientId;
        if (resultHolder.answerFrom === 'callChitChat') {
            if (answerUtil.findAnswerSet(resultHolder.user, clientId + '_chitchat') != null) {
                clientId = clientId + '_chitchat';
            } else {
                clientId = 'virtual_chitchat';
            }
        }

        let answerIds = resultHolder.output.answer_id;;
        if (typeof answerIds === 'string') {
            answerIds = [answerIds];
        }

        resultHolder.output.text = [];
        if (!Array.isArray(resultHolder.output.answer_proposals)) {
            resultHolder.output.answer_proposals = [];
        }

        async.forEachSeries(answerIds, function(answer, callback) {

            if (typeof answer === 'string') {
                resultHolder.debug.loadLongAnswer.answer_id.push(answer);

                answerUtil.getAnswerOption(resultHolder.user, clientId, answer, context, function(warning, answerOption) {
                    if (warning !== null) {
                        resultHolder.warnings.push(warning);
                    } else {
                        resultHolder.output.text.push(answerOption.answerText);
                        answerOption.answerProposals.forEach((answerProposal) => {
                            if (resultHolder.output.answer_proposals.indexOf(answerProposal) === -1) {
                                resultHolder.output.answer_proposals.push(answerProposal);  
                            }                               
                        });
                    }
                    callback();
                }, function(errCode, errMessage) {
                    resultHolder.debug.loadLongAnswer.success = false;
                    resultHolder.debug.loadLongAnswer.errCode = errCode;
                    resultHolder.debug.loadLongAnswer.errMessage = errMessage;
                    callback({
                        code: errCode,
                        message: errMessage
                    });
                });

            } else if (typeof answer === 'object') {
                resultHolder.debug.loadLongAnswer.answer_id.push(answer.id);

                clientId = answer.clientId;
                if (answer.answerFrom === 'callChitChat') {
                    clientId = 'virtual_chitchat';
                }

                answerUtil.getAnswerOption(resultHolder.user, clientId, answer.id, context, function(warning, answerOption) {
                    if (warning !== null) {
                        resultHolder.warnings.push(warning);
                    } else {
                        resultHolder.output.text.push(answerOption.answerText);
                        answerOption.answerProposals.forEach((answerProposal) => {
                            if (resultHolder.output.answer_proposals.indexOf(answerProposal) === -1) {
                                resultHolder.output.answer_proposals.push(answerProposal);  
                            }
                        });
                    }
                    callback();
                }, function(errCode, errMessage) {
                    resultHolder.debug.loadLongAnswer.success = false;
                    resultHolder.debug.loadLongAnswer.errCode = errCode;
                    resultHolder.debug.loadLongAnswer.errMessage = errMessage;
                    callback({
                        code: errCode,
                        message: errMessage
                    });
                });

            } else {
                callback('unrecognized answerId type!')
            }

        }, function(err) {
            if (err) return callback(err, resultHolder);

            resultHolder.debug.loadLongAnswer.success = true;

            return callback(null, resultHolder);
        });
    } else {
        return callback(null, resultHolder);
    }
};
