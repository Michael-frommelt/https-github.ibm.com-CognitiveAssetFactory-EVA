/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var profanityUtil = require('./src/util.js');
var jumpHandlingConfig = require('../../../helper/config.js').getConfig('jumpHandling');

exports.call = function(resultHolder, callback) {
    if (resultHolder.session.preventProfanity) {
        resultHolder.session.preventProfanity = false;
        return callback(null, resultHolder);
    }

    var profanityList = profanityUtil.getProfanityList(function(result) {
        if (result === null) {
            return callback(null, resultHolder);
        }

        resultHolder.session.context.profanity = {
            profanityFound: false
        };

        if (resultHolder.input.text) {

            var normalizedInput = resultHolder.input.text.toLowerCase();
            normalizedInput = normalizedInput.replace(/ä/g, 'ae');
            normalizedInput = normalizedInput.replace(/ö/g, 'oe');
            normalizedInput = normalizedInput.replace(/ü/g, 'ue');
            normalizedInput = normalizedInput.replace(/ß/g, 'ss');
            normalizedInput = normalizedInput.replace(/,/g, '');
            normalizedInput = normalizedInput.replace(/\./g, '');
            normalizedInput = normalizedInput.replace(/!/g, '');
            normalizedInput = normalizedInput.replace(/\?/g, '');
            normalizedInput = " " + normalizedInput + " ";

            tabooWordFoundLabel: for (key in result) {
                for (var i = 0; i < result[key].length; i++) {
                    var normalizedTabooWord = result[key][i].toLowerCase();
                    normalizedTabooWord = normalizedTabooWord.replace(/ä/g, 'ae');
                    normalizedTabooWord = normalizedTabooWord.replace(/ö/g, 'oe');
                    normalizedTabooWord = normalizedTabooWord.replace(/ü/g, 'ue');
                    normalizedTabooWord = normalizedTabooWord.replace(/ß/g, 'ss');
                    if (normalizedInput.indexOf(" " + normalizedTabooWord + " ") != -1) {
                        resultHolder.session.context.profanity = {
                            profanityFound: true,
                            wordCluster: key,
                            word: result[key][i]
                        }
                        resultHolder.session.context.system = jumpHandlingConfig.openingSystemContext;
                        resultHolder.output.lockLevel = 3;
                        break tabooWordFoundLabel;
                    }
                }
            }
        }

        return callback(null, resultHolder);
    });
};
