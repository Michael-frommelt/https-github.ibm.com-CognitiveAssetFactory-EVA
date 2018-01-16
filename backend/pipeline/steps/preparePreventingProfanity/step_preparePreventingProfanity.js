/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
exports.call = function(resultHolder, callback) {
    resultHolder.debug.preparePreventingProfanity = {};
    resultHolder.debug.preparePreventingProfanity.foundActionVariable = false;
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("preventProfanityNextInput") !== -1) {
        resultHolder.debug.preparePreventingProfanity.foundActionVariable = true;
        resultHolder.session.preventProfanity = true;
    }

    return callback(null, resultHolder);
};
