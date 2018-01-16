/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

var express = require('express');
var cfenv = require('cfenv');

var app = express();

app.listen(cfenv.getAppEnv().port, function () {
    console.log('Fake server started.');
});
