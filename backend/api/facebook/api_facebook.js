/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

// ##############################
// ## IMPORTS                  ##
// ##############################
var db = require('./db/db.js').getDatabase();
var facebookConfig = require('../../helper/config.js').getConfig('facebook');
var Bot = require('messenger-bot');
var clients = require('../../helper/clients.js');
var pipeline = require('../../pipeline/pipeline.js');
const LOG_TAG = "### Facebook Integration "

// ################################
// ## Facebook Bot Specification ##
// ################################
const bot = new Bot({
    token: facebookConfig.token,
    verify: facebookConfig.verify,
    app_secret: facebookConfig.appSecret
});

bot.on('error', function (err) {
    console.log(LOG_TAG + "got error with message " + err.message)
});

bot.on('message', (payload, reply, actions) => {
    console.log(LOG_TAG + "got new message: " + payload.message.text);
    startPipeline(payload.message.text, reply, actions, payload.sender.id);
});

bot.on('postback', (payload, reply, actions) => {
    console.log(LOG_TAG + "postback reveived with message: " + payload.postback.payload);
    startPipeline(payload.postback.payload, reply, actions, payload.sender.id);
});

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function (app) {
    app.get('/api/facebook', this.verify);
    app.post('/api/facebook', this.handleMessage);
};

exports.verify = function (req, res) {
    return bot._verify(req, res)
}
exports.handleMessage = function (req, res) {
    bot._handleMessage(req.body)
    res.end(JSON.stringify({ status: 'ok' }))
}

// ##############################
// ## AUTOMATIC SESSION RESET  ##
// ##############################

var deleteOldSessions = function () {
    console.log(LOG_TAG + "START: deleteOldSessions");
    var oneDayBefore = Date.now() - (60 * 60 * 6 * 1000);
    db.listSession(function (result) {
        for (var id in result) {
            var session = result[id];
            if (session.updated < oneDayBefore) {
                db.deleteSession(session.session_id, function (session_id) {
                    console.log(LOG_TAG + "DELETED: Session with session_id: " + session_id);
                }, function (error) {
                    console.error(LOG_TAG + "Error deleting Session with session_id: " + error.session_id);
                });
            }
        }
    }, function (err) {
        console.log(LOG_TAG + "ERROR RETRIEVING SESSIONS");
    })
    console.log(LOG_TAG + "END: deleteOldSessions");
}

var sessionsDeleteAfterStart = function () {
    console.log(LOG_TAG + "####### set Interval for: deleteOldSessions()");
    setInterval(deleteOldSessions, (60 * 60 * 6 * 1000));
    deleteOldSessions();
}

sessionsDeleteAfterStart();

// ##############################
// ## API                      ##
// ##############################

var startPipeline = function (userMessage, reply, actions, recipient) {
    actions.setTyping(true);

    formatInput(userMessage, function (err, formattedInput) {
        if (err) {
            console.log(LOG_TAG + 'error in formatting input:', err);
            formattedInput = userMessage; //take the original text
        }
        var text = formattedInput;
        var session_id = recipient;
        var client_id = 'facebook';

        bot.getProfile(recipient, (err, profile) => {
            if (err) {
                console.log(LOG_TAG + 'error profile info:', err);
            } else {
                username = "" + profile.first_name + " " + profile.last_name;
            }

            if (username === undefined || !username) {
                username = session_id;
            }

            db.getSession(session_id, function (result) {
                var session = result;
                var session_object = session.session;
                var user = {};
                user.username = username;
                user.clients = [];
                user.clients.push(clients.findClientById(client_id));

                var inputObject = {};
                inputObject.session = session_object;
                inputObject.input = {
                    text: text,
                };
                inputObject.user = user;
                inputObject.clientId = client_id;

                pipeline.callFromExternalFrontend(inputObject, function (err, output) {
                    if (err) throw err;
                    var isButton = output.answer_proposals && output.answer_proposals.length > 0;

                    if (Object.prototype.toString.call(output.text) === '[object Array]') {
                        var timeout = 0;
                        for (var i = 0; i < output.text.length; i++) {
                            if (i > 0) {
                                timeout += 2000
                            }
                            if (i === (output.text.length - 1) && !isButton) {
                                normaltext(reply, output, i, timeout, actions, true);
                            } else {
                                normaltext(reply, output, i, timeout, actions, false);
                            }
                        }
                        if (isButton) {
                            timeout += 2000
                            //always with timeout as buttons are always linked with response text
                            handleButtons(reply, actions, output.answer_proposals, timeout);
                        }
                    }

                    db.saveSession(session, function () {
                        return;
                    }, function (errCode, errMessage) {
                        console.log(LOG_TAG + 'sesson not saved: ', errMessage);
                        return;
                    })
                });
            }, function (errReason) {
                if (err) console.log(LOG_TAG + 'error when preparing response to facebook with error:', errReason);
                reply({
                    text: facebookConfig.defaultErrorMessage
                }, function (err) {
                    actions.setTyping(false);
                    if (err) console.log(LOG_TAG + 'error when replying to facebook with error:', err);
                    return;
                });
            });


        })
    })
};

var formatInput = function (input, callback) {
    var myOutput = input;
    myOutput = myOutput.split("\n").join(" ");
    myOutput = myOutput.split("\t").join(" ");
    myOutput = myOutput.split("\r").join(" ");
    return callback(null, myOutput);
};

function handleButtons(reply, actions, answer_proposals, timeout) {

    var elements = new Array();
    var buttons = new Array();
    var allButtons = new Array();
    var placeHolder = new Array();
    var z = 1;

    for (var k = 0; k < answer_proposals.length; k++) {
        allButtons[k] = { // add content to allButtons
            type: "postback",
            title: answer_proposals[k],
            payload: answer_proposals[k]
        };
        if (placeHolder.length < 3) {
            placeHolder.push(
                allButtons[k]
            );
            z++;

        }
        if (placeHolder.length === 3 || answer_proposals.length - 1 === k) {

            if (answer_proposals.length < 4)
                buttons.push({ "title": facebookConfig.defaultButtonMessage, "buttons": placeHolder });
            else
                buttons.push({ "title": facebookConfig.defaultButtonMessage + "< >", "buttons": placeHolder });
            placeHolder = [];
            z++;
        }
    }

    elements.push([buttons]);

    var obj = {
        "attachment": {

            "type": "template",
            "payload": {
                "template_type": "generic"
            }
        }
    };
    obj.attachment.payload["elements"] = elements[0][0];

    setTimeout(function () {
        reply(obj, (err) => {
            actions.setTyping(false);
            if (err) console.error(err);
        });
    }, timeout);
}


function normaltext(reply, response, i, timeout, actions, lastMessage) {

    setTimeout(function () {
        reply({
            text: response.text[i]
        });
        if (lastMessage) {
            actions.setTyping(false);
        } else {
            actions.setTyping(true);
        }
    }, timeout);
}

