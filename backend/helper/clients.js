/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
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
    let clientsToSend = clients.slice();

    if(!showHidden) {
        for(let index in clientsToSend) {
            if(clientsToSend[index].hidden) {
                clientsToSend.splice(index, 1);
            }
        }
    }

    if(!showTechnical) {
        for(let index in clientsToSend) {
            if(clientsToSend[index].id === technicalClientKey) {
                clientsToSend.splice(index, 1);
            }
        }
    }

    return clientsToSend;
};

exports.getUserClients = function(user, showHidden, showTechnical) {
    let clientsToSend = user.clients;

    if(!showHidden) {
        for(let index in clientsToSend) {
            if(clientsToSend[index].hidden) {
                clientsToSend.splice(index, 1);
            }
        }
    }

    if(!showTechnical) {
        for(let index in clientsToSend) {
            if(clientsToSend[index].id === technicalClientKey) {
                clientsToSend.splice(index, 1);
            }
        }
    }

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
