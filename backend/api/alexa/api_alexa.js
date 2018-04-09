/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

// ##############################
// ## IMPORTS                  ##
// ##############################
var db = require('./db/db.js').getDatabase();
var alexaConfig = require('../../helper/config.js').getConfig('alexa');
var clients = require('../../helper/clients.js');
var pipeline = require('../../pipeline/pipeline.js');
const LOG_TAG = "### Alexa Integration "
const ALEXA_APP_ID_PREFIX = "amzn1.ask.skill.";

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function (app) {
  app.post('/api/alexa', this.startPipeline);
};

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
exports.startPipeline = function (req, res) {
  var session_id;
  var application_id;

  if (req.body.session && req.body.context
    && req.body.context.System && req.body.context.System.application
    && req.body.context.System.application.applicationId) {
    session_id = req.body.session.sessionId;
    application_id = req.body.context.System.application.applicationId;
  }

  if (session_id == undefined) {
    return res.status(500).send(
      {
        message: 'sessionID missing'
      }
    );
  };
  if (application_id == undefined) {
    return res.status(500).send(
      {
        message: 'applicationID missing'
      }
    );
  };
  if (ALEXA_APP_ID_PREFIX + alexaConfig.applicationID !== application_id) {
    return res.status(401).send(
      {
        message: 'applicationIDs do not match'
      }
    );
  }

  var user_message = "";

  if (req.body.request.intent
    && req.body.request.intent.slots
    && req.body.request.intent.slots.EveryThingSlot
    && req.body.request.intent.slots.EveryThingSlot.value) {
    user_message = req.body.request.intent.slots.EveryThingSlot.value;
  }

  var client_id = 'alexa';


  var responseObject = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>" + alexaConfig.defaultErrorMessage + "</speak>"
      },
      shouldEndSession: true
    },
  };

  console.log(LOG_TAG + "Got new message: " + user_message);

  if (user_message && user_message.length > 0) {

    db.getSession(session_id, function (result) {
      var session = result;
      var session_object = session.session;
      var user = {};
      user.clients = [];
      user.clients.push(clients.findClientById(client_id));

      var inputObject = {};
      inputObject.session = session_object;
      inputObject.input = {
        text: user_message,
      };
      inputObject.user = user;
      inputObject.clientId = client_id;

      pipeline.callFromExternalFrontend(inputObject, function (err, response) {
        if (err) throw err;

        var isButton = response.answer_proposals && response.answer_proposals.length > 0;

        var responseText = "";
        if (Object.prototype.toString.call(response.text) === '[object Array]') {
          var timeout = 0;
          for (var i = 0; i < response.text.length; i++) {
            responseText += response.text[i] + " ";
          }
          if (isButton) {
            responseText += " "+alexaConfig.defaultButtonMessage+" ";
            for (var i = 0; i < response.answer_proposals.length; i++) {
              responseText += " \n " + response.answer_proposals[i];
            }
          }
        } else {
          responseText = response.text;
        }

        //TODO shouldEndSession depends on trigger in dialog flow
        responseObject.response.shouldEndSession = false;
        responseObject.response.outputSpeech.ssml = "<speak>" + responseText.replace(/<(?:.|\n)*?>/gm, '') + "</speak>";

        db.saveSession(session, function () {
          return res.json(responseObject);
        }, function (errCode, errMessage) {
          console.log(LOG_TAG + 'sesson not saved: ', errMessage);
          return res.json(responseObject);
        });
      })
    }, function (errReason) {
      if (err) console.log(LOG_TAG + 'error when preparing response to alexa with error:', errReason);
      return res.json(responseObject);
    });
  } else {
    return res.json(responseObject);
  }
};
