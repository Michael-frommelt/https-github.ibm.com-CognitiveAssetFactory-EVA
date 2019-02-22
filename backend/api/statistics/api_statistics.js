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
var permissions = require('../../helper/permissions.js');


// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
    // call api to get data for the statistic per client from cloudant db
    app.post('/api/feedback/clientStatistic', permissions.mwHasPermission('viewReport'), this.getClientStatistic);
    app.post('/api/feedback/userStatistic', permissions.mwHasPermission('viewReport'), this.getUserStatistic);
    app.post('/api/feedback/getConversationsByDay', permissions.mwHasPermission('viewReport'), this.getConversationsByDay);
    app.post('/api/feedback/getConversationsByHour', permissions.mwHasPermission('viewReport'), this.getConversationsByHour);
    app.post('/api/feedback/getConversationsLongterm', permissions.mwHasPermission('viewReport'), this.getConversationsLongterm);
    app.post('/api/feedback/messagesStatistic', permissions.mwHasPermission('viewReport'), this.getMessagesStatistic);
    app.post('/api/feedback/messagesPerUser', permissions.mwHasPermission('viewReport'), this.getMessagesPerUser);
    app.post('/api/feedback/topIntentStatistic', permissions.mwHasPermission('viewReport'), this.getTopIntentStatistic);
    app.post('/api/feedback/answerFromStatistic', permissions.mwHasPermission('viewReport'), this.getAnswerFromStatistic);
}

// ##############################
// ## API                      ##
// ##############################

exports.getClientStatistic = function(req, res) {
    var filter = {};
    if (req.body.filter) {
        filter = req.body.filter; //TODO
    }

    db.getClientStatistic(filter, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getUserStatistic = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;

    db.getUserStatistic(clientId, start, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getConversationsByDay = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getConversationsByDay(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getConversationsByHour = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getConversationsByHour(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getConversationsLongterm = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getConversationsLongterm(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getMessagesStatistic = function(req, res) {
    var clientId = req.body.clientId;

    db.getMessagesStatistic(clientId, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
}

exports.getMessagesPerUser = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getMessagesPerUser(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getTopIntentStatistic = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getTopIntentStatistic(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};

exports.getAnswerFromStatistic = function(req, res) {
    var clientId = req.body.clientId;
    var start = req.body.start;
    var end = req.body.end;

    db.getAnswerFromStatistic(clientId, start, end, function(results) {
        res.json(results);
    }, function(errCode, errReason) {
        res.status(errCode).send("Error fetching data from Database: " + errReason);
    });
};
