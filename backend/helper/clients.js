/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var db = require('./db/db.js').getDatabase();

var clients = [];
var functionsAfterReload = [];
var technicalClientKey = "admin";

exports.init = function(callbackSuccess, callbackError) {
    db.getClients(function(result) {
        clients = result;
        return callbackSuccess();
    }, function(errReason) {
        return callbackError(errReason);
    });
};

exports.reloadClients = function(callbackSuccess, callbackError) {
    this.init(function() {
        for (let index in functionsAfterReload) {
            let functionObject = functionsAfterReload[index];
            functionObject();
        }

        return callbackSuccess();
    }, callbackError);
};

exports.pushAfterReload = function(functionObject) {
    if (typeof functionObject === 'function') {
        functionsAfterReload.push(functionObject);
    } else {
        console.log("pushAfterReload got functionObject of type '" + typeof functionObject + "'. Aborting.");
    }
};

exports.getClients = function(showHidden, showTechnical) {
    let clientsToCheck = clients.slice();

    let clientsToSend = clientsToCheck.filter( function(client) {
        let send = true;
        if (!showHidden && client.hidden) {send = false;}
        if (!showTechnical && client.id === technicalClientKey) {send = false;}
        return send;
    });

    return clientsToSend;
};

exports.getUserClients = function(user, showHidden, showTechnical) {
    let clientsToCheck = user.clients;

    let clientsToSend = clientsToCheck.filter( function(client) {
        let send = true;
        if (!showHidden && client.hidden) {send = false;}
        if (!showTechnical && client.id === technicalClientKey) {send = false;}
        return send;
    });

    return clientsToSend;
};

exports.findClientById = function(clientId) {
    for (var index in clients) {
        if (clients[index].id === clientId) {
            return clients[index];
        }
    }
    return null;
};

exports.findClientByIdInUser = function(user, clientId) {
    for (var index in user.clients) {
        if (user.clients[index].id == clientId) {
            return user.clients[index];
        }
    }
    return null;
};

exports.isClientTechnical = function(clientId) {
    if(clientId === technicalClientKey) {
        return true;
    } else {
        return false;
    }
}
