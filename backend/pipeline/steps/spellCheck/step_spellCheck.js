/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var request = require('request');
var correctorConfig = require('../../../helper/config.js').getConfig('corrector');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.spellcheck = {};

    var execution = false;

    if (correctorConfig.enabled && resultHolder.input.text && !resultHolder.session.preventSpellcheck) {
        execution = true;
        var requestDocumentCorrector = createCorrectorRequest(resultHolder.input.text);
        request.post(requestDocumentCorrector, function(err, res, body) {
            if (err || res.statusCode != 200) {
                resultHolder.debug.spellcheck.success = false;
                resultHolder.debug.spellcheck.error = err;
                if (err && err.code && err.code === "ETIMEDOUT") {
                    console.error("##### SpellCheck: ETIMEDOUT");
                }
            } else {
                var response = JSON.parse(body);
                if (response.state != 'success') {
                    resultHolder.debug.spellcheck.success = false;
                    resultHolder.debug.spellcheck.error = response.message;
                } else {
                    resultHolder.debug.spellcheck.success = true;
                    resultHolder.debug.spellcheck.input = resultHolder.input.text;
                    resultHolder.debug.spellcheck.output = response.data;
                    resultHolder.input.text = response.data;
                }
            }

            return callback(null, resultHolder);
        });
    }

    if (resultHolder.session.preventSpellcheck) {
        resultHolder.session.preventSpellcheck = false;
    }

    if (!execution) {
        resultHolder.debug.spellcheck.execution = false;
        return callback(null, resultHolder);
    }
};

function createCorrectorRequest(input) {
    var requestDocumentCorretor = {
        url: correctorConfig.url,
        body: input,
        headers: {
            'Content-Type': 'text/plain'
        },
        timeout: 5000
    };
    return requestDocumentCorretor;
};
