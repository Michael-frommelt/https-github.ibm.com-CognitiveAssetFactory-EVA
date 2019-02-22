/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var dtValidator = require("./src/dateValidator.js");
var mailer = require('./src/util.js');
var mailerConfig = require('../../../helper/config.js').getConfig('mailer');

exports.call = function(resultHolder, callback) {
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("callArrangeZSMDate") !== -1) {
        resultHolder.debug.mail = {
            execution: false
        };

        //lock the inputs
        resultHolder.output.lockLevel = 2;

        var buttons = [];
        resultHolder.output.answer_proposals = [];

        //get valided dates
        buttons = dtValidator.getDates();

        if (typeof buttons === 'undefined' || buttons.length <= 0) {
            var errorText = "undefined dates !";
            resultHolder.debug.mail.error = errorText;
            resultHolder.warnings.push(errorText);

            return callback(null, resultHolder);
        }

        //render buttons
        for (var i = 0; i < buttons.length; i++) {
            resultHolder.output.answer_proposals.push(buttons[i]);
        }

        resultHolder.output.answer_proposals.push("Abbruch");

        return callback(null, resultHolder);

    } else if (resultHolder.output.actions && resultHolder.output.actions.indexOf("callArrangeZSMHours") !== -1) {
        resultHolder.debug.mail = {
            execution: false
        };

        //lock the inputs
        resultHolder.output.lockLevel = 2;

        var buttons = [];
        resultHolder.output.answer_proposals = [];

        //get valided hours
        buttons = dtValidator.getHours(resultHolder.session.context.callZSMDate);

        if (typeof buttons === 'undefined' || !buttons || buttons.length <= 0) {
            var errorText = "invalid datetime values !";
            resultHolder.debug.mail.error = errorText;
            resultHolder.warnings.push(errorText);

            return callback(null, resultHolder);
        }

        //render buttons
        for (var i = 0; i < buttons.length; i++) {
            resultHolder.output.answer_proposals.push(buttons[i]);
        }

        resultHolder.output.answer_proposals.push("Abbruch");

        return callback(null, resultHolder);

    } else if (resultHolder.output.actions && resultHolder.output.actions.indexOf("callSentEmailZSM") !== -1) {
        resultHolder.debug.mail = {
            execution: true
        };

        mailer.sendEmail(resultHolder, function(error, result) {
            if (error) {
                resultHolder.debug.mail.error = error;
                if (error.code && error.message) {
                    resultHolder.warnings.push("Error from SendGrid - Code: " + error.code + "; Message: " + error.message);
                } else {
                    resultHolder.warnings.push(error);
                }
                resultHolder.output.answer_id = [mailerConfig.errorMessage];
            }
            return callback(null, resultHolder);
        });
    } else {
        return callback(null, resultHolder);
    }
};
