/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
