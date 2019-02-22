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

var express = require('express');
var cfenv = require('cfenv');

var app = express();

app.listen(cfenv.getAppEnv().port, function () {
    console.log('Fake server started.');
});
