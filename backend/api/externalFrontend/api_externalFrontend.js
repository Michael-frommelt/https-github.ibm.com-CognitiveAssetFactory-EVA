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
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
var db = require('./db/db.js').getDatabase();
var clients = require('../../helper/clients.js');
var pipeline = require('../../pipeline/pipeline.js');
var feedbackApi = require('../feedback/api_feedback.js');
var externalFrontendConfig = require('../../helper/config.js').getConfig('external_frontend');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.post('/api/public/authenticate', this.authenticateApp);
  app.post('/api/public/message', this.validateAuthentication, this.startPipeline);
  app.post('/api/public/feedback', this.validateAuthentication, this.saveFeedback);
  app.post('/api/public/conversation-feedback', this.validateAuthentication, this.saveConversationFeedback);
  app.post('/api/public/session/reset', this.validateAuthentication, this.resetSession);
  app.post('/api/public/session/keepalive', this.validateAuthentication, this.keepaliveSession);
};

// ##############################
// ## AUTOMATIC SESSION RESET  ##
// ##############################
var deleteOldSessions = function() {
  console.log("START: deleteOldSessions");
  var oneDayBefore = Date.now() - (60 * 60 * 6 * 1000);
  db.listSession(function(result) {
    for(var id in result) {
      var session = result[id];
      if(session.updated < oneDayBefore) {
        db.deleteSession(session.session_id, function(session_id) {
          console.log("DELETED: Session with session_id: " + session_id);
        }, function(error) {
          console.error("Error deleting Session with session_id: " + error.session_id);
        });
      }
    }
  }, function(err) {
    console.log("ERROR RETRIEVING SESSIONS");
  })
  console.log("END: deleteOldSessions");
}

var sessionsDeleteAfterStart = function(){
  console.log("####### set Interval for: deleteOldSessions()");
  setInterval(deleteOldSessions, (60 * 60 * 6 * 1000));
  deleteOldSessions();
}
sessionsDeleteAfterStart();

// ##############################
// ## API                      ##
// ##############################
exports.authenticateApp = function(req, res) {
  var jwt_secret = externalFrontendConfig.jwt_secret;

  if(jwt_secret === undefined || jwt_secret === null || jwt_secret === "") {
    return res.status(500).send({
      success: false,
      message: 'jwt_secret_missing'
    });
  }

  var given_app_id = req.body.app_id;
  var given_secret = req.body.secret;

  if(given_app_id === undefined || given_app_id === null || given_app_id === "" ||
    given_secret === undefined || given_secret === null || given_secret === "") {
    return res.status(403).send({
      success: false,
      message: 'app_id_or_secret_not_set'
    });
  }

  var token_exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
  var rnd_secret = require('crypto').randomBytes(256).toString('hex');

  db.getApp(given_app_id, function(result) {
    var app = result;
    
    var same = false;
    try {
      same = crypto.timingSafeEqual(Buffer.from(app.app_id), Buffer.from(given_app_id)) 
    && crypto.timingSafeEqual(Buffer.from(app.secret), Buffer.from(given_secret));
    } catch (error) {
      same = false;
    }

    if(same) {
      var token = jwt.sign({
        exp: token_exp,
        app_id: given_app_id,
        rnd_secret: rnd_secret
      }, jwt_secret);

      return res.json({
        success: true,
        message: 'authentication_successful',
        auth_token: token
      });
    } else {
      return res.status(403).send({
        success: false,
        message: 'wrong_app_id_or_secret'
      });
    }
  }, function(errReason) {
    if(errReason === "app_not_found") {
      return res.status(403).send({
        success: false,
        message: 'wrong_app_id_or_secret'
      });
    } else {
      return res.status(500).send({
        success: false,
        message: 'internal_server_error'
      });
    }
  });
};

exports.startPipeline = function(req, res) {
  var session_id = req.body.session_id;
  var client_id = req.body.client_id;
  var username = req.body.user_name;
  var text = req.body.text;
  
  if(session_id === undefined || !session_id) {
    return res.status(400).send({
      success: false,
      message: 'session_id_missing'
    });
  }

  if(client_id === undefined || !client_id) {
    return res.status(400).send({
      success: false,
      message: 'client_id_missing'
    });
  }

  if(username === undefined || !username) {
    username = session_id;
  }

  db.getSession(session_id, function(result) {
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
    
    pipeline.callFromExternalFrontend(inputObject, function(err, output) {
      if (err) {
        var errMessage = '';
        if (typeof err === "string") errMessage = err;
        else {
          try {
            errMessage = JSON.stringify(err);
          } catch (e) {
            console.error(err);
            errMessage = 'unknown_error';
          }
        }

        return res.status(500).send({
          success: false,
          message: errMessage
        });
      }

      var cleanedOutput = {};

      if (output) {
        var answerIdStringArray = [];
        for (var answerId of output.answer_id) {
          if (typeof answerId === 'object') {
            answerIdStringArray.push(answerId.id);
          } else if (typeof answerId === 'string') {
            answerIdStringArray.push(answerId);
          }
        }

        cleanedOutput.success = true;
        cleanedOutput.message = 'answer_given';
        cleanedOutput.text = output.text ? output.text : [];
        cleanedOutput.answer_id = answerIdStringArray;
        cleanedOutput.lock_level = output.lockLevel ? output.lockLevel : 0;
        cleanedOutput.answer_proposals = output.answer_proposals ? output.answer_proposals : [];
        cleanedOutput.warnings = output.warnings ? output.warnings : [];
        cleanedOutput.message_id = output.messageId;
        cleanedOutput.actions = output.actions ? output.actions : [];
      } else {
        return res.status(500).send({
          success: false,
          message: 'got_no_output_object'
        });
      }

      db.saveSession(session, function() {
        return res.json(cleanedOutput);
      }, function(errCode, errMessage) {
        cleanedOutput.warning = "session_not_saved";
        cleanedOutput.session_error = errMessage;
        return res.json(cleanedOutput);
      })
    });
  }, function(errReason) {
    return res.status(500).send({
      success: false,
      message: 'internal_server_session_error'
    });
  });
};

exports.saveFeedback = function(req, res) {
  var session_id = req.body.session_id;
  var client_id = req.body.client_id;
  var message_id = req.body.message_id;
  var comment = req.body.comment;
  var feedback = req.body.feedback;

  if(session_id === undefined || !session_id) {
    return res.status(400).send({
      success: false,
      message: 'session_id_missing'
    });
  }

  if(client_id === undefined || !client_id) {
    return res.status(400).send({
      success: false,
      message: 'client_id_missing'
    });
  }

  if(message_id === undefined || !message_id) {
    return res.status(400).send({
      success: false,
      message: 'message_id_missing'
    });
  }

  db.getSession(session_id, function(result) {
    var session = result;
    if(session && session.session && session.session[client_id]) {
      var session_object = session.session[client_id];

      feedbackApi.saveFeedbackExternal(
        session_object,
        message_id,
        feedback, comment,
        function() {
          db.saveSession(session, function() {
            return res.json({
              success: true,
              message: 'feedback_saved'
            });
          }, function(errCode, errMessage) {
            var output = {
              success: true,
              message: 'feedback_saved',
              warning: 'session_not_saved',
              session_error: errMessage
            };
            return res.json(output);
          });
        },
        function(errCode, errMessage) {
          return res.status(500).send({
            success: false,
            message: 'feedback_not_saved'
          })
        }
      );
    } else {
      return res.status(404).send({
        success: false,
        message: 'session_object_empty'
      });
    }
  }, function(errReason) {
    return res.status(500).send({
      success: false,
      message: 'internal_server_session_error'
    });
  });
};

exports.saveConversationFeedback = function(req, res) {
  var session_id = req.body.session_id;
  var client_id = req.body.client_id;
  var comment = req.body.comment;
  var rating = req.body.rating;
  var username = req.body.user_name;

  if(session_id === undefined || !session_id) {
    return res.status(400).send({
      success: false,
      message: 'session_id_missing'
    });
  }

  if(client_id === undefined || !client_id) {
    return res.status(400).send({
      success: false,
      message: 'client_id_missing'
    });
  }

  if (username == null) {
    username = '';
  }

  db.getSession(session_id, function(result) {
    var session = result;
    if(session && session.session && session.session[client_id]) {
      var session_object = session.session[client_id];
      var conversationId;
      if (!(session_object.watson && typeof session_object.watson.conversationId === 'string')) {
        return res.status(404).send({
          success: false,
          message: 'no_conversation_id_in_session'
        });
      } else {
        conversationId = session_object.watson.conversationId;
      }

      feedbackApi.saveConversationFeedbackExternal(client_id, comment, conversationId, rating, username, function() {
        return res.json({
          success: true,
          message: 'conversation_feedback_saved',
        });
      }, function(error) {
        res.status(500).send({
          success: false,
          message: 'conversation_feedback_not_saved',
        });
      });
    } else {
      return res.status(404).send({
        success: false,
        message: 'session_object_empty'
      });
    }
  }, function(errReason) {
    return res.status(500).send({
      success: false,
      message: 'internal_server_session_error'
    });
  });
};

exports.resetSession = function(req, res) {
  var session_id = req.body.session_id;

  if(session_id === undefined || !session_id) {
    return res.status(400).send({
      success: false,
      message: 'session_id_missing'
    });
  }

  db.deleteSession(session_id, function(session_id) {
    return res.json({
      success: true,
      message: 'session_deleted'
    });
  }, function(err) {
    var errMessage = '';
    if (typeof err === "string") errMessage = err;
    else {
      try {
        errMessage = JSON.stringify(err);
      } catch (e) {
        console.error(err);
        errMessage = 'unknown_error';
      }
    }

    return res.status(500).send({
      success: false,
      message: errMessage
    });
  });
};

exports.keepaliveSession = function(req, res) {
  var session_id = req.body.session_id;

  if (session_id === undefined || !session_id) {
    return res.status(400).send({
      success: false,
      message: 'session_id_missing'
    });
  }

  db.getSession(session_id, function(result) {
    var session = result;

    db.saveSession(session, function() {
      return res.json({
        success: true,
        message: 'session_updated'
      });
    }, function(errCode, errMessage) {
      return res.status(500).send({
        success: false,
        message: 'session_not_saved'
      });
    });
  }, function(errReason) {
    return res.status(500).send({
      success: false,
      message: 'internal_server_session_error'
    });
  });
};

exports.validateAuthentication = function(req, res, next) {
  var jwt_secret = externalFrontendConfig.jwt_secret;
  var auth_token = req.headers['x-access-token'];

  if(auth_token !== undefined && auth_token) {
    jwt.verify(auth_token, jwt_secret, function(err, decoded) {
      if(err) {
        errMessage = "auth_token_invalid";
        if(err.name === "TokenExpiredError") {
          errMessage = "auth_token_expired";
        }
        return res.status(403).send({
          success: false,
          message: errMessage
        });
      } else {
        db.getApp(decoded.app_id, function(result) {
          var app = result;
          
          var same = false;
          try {
            same = crypto.timingSafeEqual(Buffer.from(app.app_id), Buffer.from(decoded.app_id));
          } catch (error) {
            same = false;
          }

          if(same) {
            return next();
          } else {
            return res.status(403).send({
              success: false,
              message: 'app_id_not_valid'
            });
          }
        }, function(errReason) {
          if(errReason === "app_not_found") {
            return res.status(403).send({
              success: false,
              message: 'app_id_not_valid'
            });
          } else {
            console.error("could_not_valid_app_id_db_connection_error");
            return next();
          }
        });
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'auth_token_missing'
    });
  }
};
