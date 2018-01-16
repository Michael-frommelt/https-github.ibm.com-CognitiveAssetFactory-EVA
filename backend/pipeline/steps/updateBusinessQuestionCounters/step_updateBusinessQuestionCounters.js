/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var guidingConceptConfig = require('../../../helper/config.js').getConfig('guidingConcept');

exports.call = function(resultHolder, callback) {
    // Business related questions
    if (resultHolder.session.context.is_business_question) {
        resultHolder.session.context.business_question_counter++;
        if (resultHolder.session.context.non_business_question_score < 0) {
            resultHolder.session.context.non_business_question_score = 0;
        } else {
            resultHolder.session.context.non_business_question_score = 1;
        }

    } else { // CC & Basiswissen questions. Anything-Else & Begrüßung & Bestätigungen & Verabschiedungen zählen nicht zu nonbusiness
        if ((resultHolder.chitChat != null && resultHolder.chitChat.context.is_non_business_question) || resultHolder.session.context.is_non_business_question) {
            resultHolder.session.context.non_business_question_score--;

            if (resultHolder.session.context.non_business_question_score == guidingConceptConfig.back_to_topic.non_business_question_score_limit) {
                resultHolder.output.answer_id.push("Zurück_zum_Thema_1");
            } else if (resultHolder.session.context.non_business_question_score == (guidingConceptConfig.back_to_topic.non_business_question_score_limit - 1)) {
                resultHolder.output.answer_id.push("Zurück_zum_Thema_2");
            } else if (resultHolder.session.context.non_business_question_score <= (guidingConceptConfig.back_to_topic.non_business_question_score_limit - 2)) {
                resultHolder.output.answer_id.push("Zurück_zum_Thema_3");
                resultHolder.session.context.non_business_question_score = (guidingConceptConfig.back_to_topic.non_business_question_score_limit - 2);
                resultHolder.output.lockLevel = 2;
            }
            var index = resultHolder.output.answer_id.indexOf('Gesprächserhaltung_01');
            if (index != -1) {
                resultHolder.output.answer_id.splice(index, 1)
            }
        }
    }

    return callback(null, resultHolder);
};
