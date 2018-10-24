/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var async = require('async');
const db = require('../db/db.js').getDatabase();

const regex = /\${([A-Za-z0-9äöüß][A-Za-z0-9äöüß_\s.-]*?[A-Za-z0-9äöüß])}/g;

// export function of replaceAnswer
exports.replaceAnswerExports = function(alreadyMentioned, missingCounter, callback, resultHolder) {
    replaceAnswer(alreadyMentioned, missingCounter, callback, resultHolder);
}

// returns array of regex matches
var getVariableOccurences = function(resultHolder, alreadyMentioned) {
    var matches = [];

    //find all variables in all outputs
    resultHolder.output.text.forEach(function(response, index) {
        do {
            match = regex.exec(response);
            if (match) {
                matches.push({
                    answerIndex: index,
                    match: match
                });
                if (alreadyMentioned[match[1]] === undefined) alreadyMentioned[match[1]] = false;
            }
        } while (match)
    });

    return matches;
}


// loads var from context and replaces it in text
var loadContextVar = function(resultHolder, match, rawText) {
    let matchedVar = getVar(resultHolder.currentContext,match.match[1]);
    if (matchedVar) {
        resultHolder.output.text[match.answerIndex] = rawText.replace(match.match[0],matchedVar);
         

        match.rawText = rawText;
        resultHolder.debug.replaceVariables.executed = true;
        resultHolder.debug.replaceVariables.matches.push(match);

        return true;
    } else {
        return false;
    }
};

//if variable is an object, split at the '.' character and search for variable inside the object (repeat until at the right level)
var getVar = function(model, path) {
    let Vars = model;
    let varPath = path.split('.');
      
    if (varPath.length > 1 && typeof Vars[varPath[0]] === 'object') {
        return getVar(model[varPath[0]],varPath.splice(1).join('.'));
    }
    else if (model[varPath[0]]) {
      return model[varPath[0]];
    }
    else {
        console.log('variable ' + varPath[0] + 'not found');
        return;
    }
};

// loads var from variable store and replaces it in text
var replaceAnswer = function(alreadyMentioned, missingCounter, finalCallback, resultHolder) {
    var matches = getVariableOccurences(resultHolder, alreadyMentioned);

    if (matches.length <= missingCounter) {
        return finalCallback(null, resultHolder);
    }

    //lookup and replace all variables with their actual values
    async.forEach(matches, function(match, callback) {
        findVariable(match, function(result, match) {
            var rawText = resultHolder.output.text[match.answerIndex];
            if (result.length > 0) {
                if (!alreadyMentioned[match.match[1]]) {
                    if (result[0].tooltip == null) {
                        if (result[0].abbreviation == null) {
                            rawText = rawText.replace(new RegExp('\\' + match.match[0]), result[0].value);
                        } else {
                            rawText = rawText.replace(new RegExp('\\' + match.match[0]), result[0].value + " (" + result[0].abbreviation + ")");
                        }
                    } else {
                        if (result[0].abbreviation == null) {
                            rawText = rawText.replace(new RegExp('\\' + match.match[0]), '<span data-toggle="tooltip" data-container="body" class="eva_tooltip" title="' + result[0].tooltip + '">' + result[0].value + '</span>');
                        } else {
                            rawText = rawText.replace(new RegExp('\\' + match.match[0]), '<span data-toggle="tooltip" data-container="body" class="eva_tooltip" title="' + result[0].tooltip + '">' + result[0].value + " (" + result[0].abbreviation + ")" + '</span>');
                        }
                    }
                    alreadyMentioned[match.match[1]] = true;
                } else {
                    if (result[0].abbreviation == null) {
                        rawText = rawText.replace(new RegExp('\\' + match.match[0]), result[0].value);
                    } else {
                        rawText = rawText.replace(new RegExp('\\' + match.match[0]), result[0].abbreviation);
                    }
                }

                resultHolder.output.text[match.answerIndex] = rawText;

                match.rawText = rawText;
                resultHolder.debug.replaceVariables.executed = true;
                resultHolder.debug.replaceVariables.matches.push(match);

            } else {
                if (!loadContextVar(resultHolder, match, rawText)) {
                    missingCounter++;
                }
            }
            return callback();
        }, function(err) {
            var rawText = resultHolder.output.text[match.answerIndex];
            loadContextVar(resultHolder, match, rawText);
            console.log("Error retrieving variables from database:" + err);
            return finalCallback(null, resultHolder);
        });
    }, function(err) {
        if (err) {
            console.log(err);
            return finalCallback(null, resultHolder);
        }
        replaceAnswer(alreadyMentioned, missingCounter, finalCallback, resultHolder);
    });
};

function findVariable(match, callbackSuccess, callbackError) {
    db.findVariable(match, function(result) {
        return callbackSuccess(result, match);
    }, function(err) {
        return callbackError(err);
    });
};
