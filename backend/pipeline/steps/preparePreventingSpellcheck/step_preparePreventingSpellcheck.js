/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
exports.call = function(resultHolder, callback) {
    resultHolder.debug.preparePreventingSpellcheck = {};
    resultHolder.debug.preparePreventingSpellcheck.foundActionVariable = false;
    if (resultHolder.output.actions && resultHolder.output.actions.indexOf("preventSpellcheckNextInput") !== -1) {
        resultHolder.debug.preparePreventingSpellcheck.foundActionVariable = true;
        resultHolder.session.preventSpellcheck = true;
    }

    return callback(null, resultHolder);
};
