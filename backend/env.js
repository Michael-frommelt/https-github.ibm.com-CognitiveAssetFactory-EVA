/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

var cfenv = require('cfenv');
var dotenv = require('dotenv');

if (!cfenv.getAppEnv().isLocal) {
    module.exports = cfenv.getAppEnv();
} else {
    dotenv.config({path: './backend/.env'});
    var server = {
        port: 8070,
        url: 'http://localhost:8070',
        isLocal: true
    };
    module.exports = server;
}
