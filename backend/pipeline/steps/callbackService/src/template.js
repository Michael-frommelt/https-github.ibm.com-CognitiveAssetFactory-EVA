/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

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
