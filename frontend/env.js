/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

var cfenv = require('cfenv');

if(!cfenv.getAppEnv().isLocal) {
  module.exports = cfenv.getAppEnv();
} else {
  var server = {
    port: 8080,
    url: 'http://localhost:8080',
    isLocal: true
  };
  module.exports = server;
}
