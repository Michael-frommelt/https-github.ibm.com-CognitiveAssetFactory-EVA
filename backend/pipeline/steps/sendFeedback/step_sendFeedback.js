/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var feedbackApi = require('../../../api/feedback/api_feedback.js');
var config = require('../../../helper/config.js').getConfig('general');

exports.call = function(resultHolder, callback) {
    var sendFeedback = false;
    if (resultHolder.setNegativeFeedback || config.logEveryMessage) {
        sendFeedback = true;
    }

    // hey! it's a test, don't spam our database!
    if(resultHolder.isTest) sendFeedback = false;

    resultHolder.debug.sendFeedback = {};
    if (sendFeedback) {
        resultHolder.debug.sendFeedback.necessary = true;
        var feedback = false;
        if (resultHolder.setNegativeFeedback) {
            resultHolder.debug.sendFeedback.reason = "noAnswer";
            feedback = 'negative';
        } else {
            resultHolder.debug.sendFeedback.reason = "logEveryMessage";
        }
        resultHolder.debug.sendFeedback.feedback = feedback;
        feedbackApi.saveFeedbackIntern(resultHolder.session, resultHolder.session.messageId, feedback, function(result) {
            resultHolder.debug.sendFeedback.success = true;
            if (feedback !== false) {
                resultHolder.output.rated = true;
            }

            return callback(null, resultHolder);
        }, function(errCode, errReason) {
            resultHolder.debug.sendFeedback.success = false;
            return callback(null, resultHolder);
        }, true);
    } else {
        resultHolder.debug.sendFeedback.necessary = false;
        return callback(null, resultHolder);
    }
};
