/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var fs = require('fs');
var path = require('path');
var mailerConfig = require('../../../../helper/config.js').getConfig('mailer');

exports.read = function() {

    var filePath = path.join(__dirname, mailerConfig.bodyTemplate);

    var fileBodyTemplate = fs.readFileSync(filePath, "utf8", function(err, data) {
        if (err) {
            return console.log(err);
        }
        console.log(data);
    });

    return fileBodyTemplate;
}
