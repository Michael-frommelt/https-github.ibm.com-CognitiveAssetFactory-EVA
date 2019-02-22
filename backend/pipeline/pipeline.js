/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

var async = require('async');
var clients = require('../helper/clients.js');
var permissions = require('../helper/permissions.js');
var domain = require('domain');
var prepareInput = require('./steps/prepareInput/step_prepareInput.js');
var prepareInputMiniPipeline = require('./steps/prepareInputMiniPipeline/step_prepareInputMiniPipeline.js');
var config = require('../helper/config.js').getConfig('general');

// steps for regular pipeline
var steps = {
    updateWCSCounter: require('./steps/updateWCSCounter/step_updateWCSCounter.js'),
    profanityCheck: require('./steps/profanityCheck/step_profanityCheck.js'),
    spellCheck: require('./steps/spellCheck/step_spellCheck.js'),
    callConversation: require('./steps/callConversation/step_callConversation.js'),
    callFindQuestions: require('./steps/callFindQuestions/step_callFindQuestions.js'),
    callChitChat: require('./steps/callChitChat/step_callChitChat.js'),
    //callbackService: require('./steps/callbackService/step_callbackService.js'),
    handleJump: require('./steps/handleJump/step_handleJump.js'),
    updateBusinessQuestionCounters: require('./steps/updateBusinessQuestionCounters/step_updateBusinessQuestionCounters.js'),
    updateSequentWrongAnswerCounter: require('./steps/updateSequentWrongAnswerCounter/step_updateSequentWrongAnswerCounter.js'),
    loadLongAnswer: require('./steps/loadLongAnswer/step_loadLongAnswer.js'),
    loadTimeDependantFarewell: require('./steps/loadTimeDependantFarewell/step_loadTimeDependantFarewell.js'),
    //callCurrentWeather: require('./steps/callCurrentWeather/step_callCurrentWeather.js'),
    replaceVariables: require('./steps/replaceVariables/step_replaceVariables.js'),
    prepareAnaphoraResolution: require('./steps/prepareAnaphoraResolution/step_prepareAnaphoraResolution.js'),
    preparePreventingSpellcheck: require('./steps/preparePreventingSpellcheck/step_preparePreventingSpellcheck.js'),
    preparePreventingProfanity: require('./steps/preparePreventingProfanity/step_preparePreventingProfanity.js'),
    prepareFeedback: require('./steps/prepareFeedback/step_prepareFeedback.js'),
    sendFeedback: require('./steps/sendFeedback/step_sendFeedback.js')
};

// steps for minimal pipeline (maintenance mode or welcomeMessageFromConfig mode)
var stepsMiniPipeline = {
    loadLongAnswer: require('./steps/loadLongAnswer/step_loadLongAnswer.js')
};

exports.createRoutes = function(app) {
    app.post('/api/message', permissions.mwHasPermission('isAuthenticated'), this.callFromEndpoint);

    // Endpoint to be call from the client side
    app.post('/api/session/reset', permissions.mwHasPermission('isAuthenticated'), function(req, res) {
        req.session[req.body.clientId] = undefined;
        req.session.save(function() {
            if (config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("reset done.");
            return res.json({
                session_reset: true
            });
        })
    });
};

exports.callFromEndpoint = function(req, res) {
    var inputObject = {};
    if (req.body) {
        inputObject.clientId = req.body.clientId;
        inputObject.input = req.body.input;
    }

    inputObject.session = req.session;
    inputObject.user = req.user;

    var sendToClient = function(err, output) {
        if (err) { // err.code ||
            return res.status(500).json(err);
        }

        return res.json(output);
    };

    start(inputObject, sendToClient);
};

exports.callFromExternalFrontend = function(inputObject, callback) {
    start(inputObject, callback);
};

var start = function(inputObject, cb) {
    var d = domain.create();

    // Domain emits 'error' when it's given an unhandled error
    d.on('error', function(err) {
        // Our handler should deal with the error in an appropriate way
        var errorObject = getConfigErrorMessageObject(err.stack);
        console.error('d.error', err.stack);
        this.exit();
        return cb(errorObject);
    });

    // Enter this domain
    d.enter();

    // validate the clientId
    var clientId = inputObject.clientId;
    var client = clients.findClientById(clientId);
    if (client === null) {
        d.exit();
        return cb({
            code: 400,
            message: 'Invalid_clientId',
        }, null);
    }

    if(clients.isClientTechnical(clientId)) {
        d.exit();
        return cb({
            code: 400,
            message: 'technical_client_admin_not_allowed',
        }, null);
    }

    // skip maintenance mode if this is started by dialog testing
    if (inputObject.isTest !== true) {
        // Check for maintenance mode
        if (checkMaintenance(inputObject, d, cb)) return;
    }

    var welcomeMessageFromConfig = client.welcomeMessageFromConfig;
    if (!sessionClear(inputObject) || !welcomeMessageFromConfig) {
        if (!inputObject.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("##### starting pipeline");
        var resultHolder = {};

        var tasks = getTasks(d, steps);
        tasks.unshift(async.apply(prepareInput.call, inputObject, resultHolder));

        async.waterfall(tasks, async.apply(sendResult, d, cb));
    } else {
        if (!inputObject.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("##### welcome message from config");
        let answerIds = [];
        answerIds.push(client.welcomeMessage);
        inputObject.answerIds = answerIds;
        inputObject.mode = 'welcomeMessageFromConfig';

        var resultHolder = {};

        var tasks = getTasks(d, stepsMiniPipeline);
        tasks.unshift(async.apply(prepareInputMiniPipeline.call, inputObject, resultHolder));

        async.waterfall(tasks, async.apply(sendResult, d, cb));
    }
};

var sendResult = function(domain, cb, err, resultHolder) {
    if (err) {
        var debugObject;
        if (resultHolder) {
            debugObject = resultHolder.debug;
        }
        var errorObject = getConfigErrorMessageObject(err, debugObject);
        console.error(err);
        domain.exit();
        return cb(errorObject);
    }

    log(resultHolder, "sendResult");

    var output = resultHolder.output;
    resultHolder.debug.answerFrom = resultHolder.answerFrom;
    if (resultHolder.user.debugmode) {
        output.debug = JSON.parse(JSON.stringify(resultHolder.debug));
    }
    output.warnings = resultHolder.warnings;

    domain.exit();
    return cb(null, resultHolder.output);
};

var getConfigErrorMessageObject = function(error, debugObject) {
    var errorObject = {};
    if (debugObject) {
        errorObject.debug = JSON.parse(JSON.stringify(debugObject));
    } else {
        errorObject.debug = {};
        errorObject.debug.error = "no_debug_information";
    }
    errorObject.text = config.errorMessage;
    errorObject.err = error;
    return errorObject;
};

var checkMaintenance = function(inputObject, d, cb) {
    if (config.maintenanceEnabled) {
        if (!config.maintenanceAnswerId) {
            console.error("[MAINTENANCE] Maintenance mode is enabled, but no maintenanceAnswerId set!");
            return false;
        }

        inputObject.answerIds = [config.maintenanceAnswerId];
        inputObject.mode = 'maintenanceMode';

        var resultHolder = {};

        var tasks = getTasks(d, stepsMiniPipeline);
        tasks.unshift(async.apply(prepareInputMiniPipeline.call, inputObject, resultHolder));

        async.waterfall(tasks, async.apply(sendResult, d, cb));

        return true;
    } else {
        return false;
    }
};

var sessionClear = function(inputObject) {
    if (inputObject.session[inputObject.clientId] === undefined || inputObject.session[inputObject.clientId] === null || inputObject.session[inputObject.clientId].watson === undefined) {
        if (!inputObject.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("----- session IS clear");
        return true;
    } else {
        if (!inputObject.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) console.log("----- session NOT clear");
        return false;
    }
};

function getTasks(d, givenSteps) {
    let tasks = [];

    for (let key in givenSteps) {
        let task = function(resultHolder, callback) {
            log(resultHolder, key);
            d.run(givenSteps[key].call, resultHolder, callback);
        };
        tasks.push(task);
    };

    return tasks;
}

function log(resultHolder, name) {
    if (resultHolder.debug.calledFunctions.length === 0) {
        var time = Date.now();
        resultHolder.debug.calledFunctions.push(name + "@" + time);
        if (!resultHolder.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) {
            console.log(name + "@" + time);
        }
    } else {
        var timeToLast = 0;
        for (var i = 0; i < resultHolder.debug.calledFunctions.length; i++) {
            var last = resultHolder.debug.calledFunctions[i];
            var res;
            if (i === 0) {
                res = last.split("@");
            } else {
                res = last.split("+");
            }
            timeToLast += parseInt(res[1]);
        }
        var timeNow = Date.now();
        var diff = timeNow - timeToLast;
        resultHolder.debug.calledFunctions.push(name + "+" + diff);

        // generating console output
        if (!resultHolder.isTest && config && config.backendLogLevel && config.backendLogLevel >= 3) {
            console.log(name + "+" + diff);
        }

        // throw warning, if last step lasted more than 5 seconds
        if (diff >= 3000) {
            var convId = "unknown";
            if (resultHolder.session && resultHolder.session.conversationId) {
                convId = resultHolder.session.conversationId;
            }
            console.warn("[WARNING][" + convId + "][" + new Date() + "] " + name + " started " + diff + "ms after last step!");
        }
    }
};
