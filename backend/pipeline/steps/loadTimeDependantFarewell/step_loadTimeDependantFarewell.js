/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
var moment_tz = require('moment-timezone');
var farewellUtil = require('../../helper/farewell.js');

exports.call = function(resultHolder, callback) {
    try {
        var flag = false;
        for (var index in resultHolder.output.text) {
            if (resultHolder.output.text[index] === undefined) continue;
            if (resultHolder.output.text[index].indexOf("${farewell}") >= 0) {
                flag = true;
            }
        }

        if (flag) {
            var date = moment_tz().tz("Europe/Berlin");

            var farewell = farewellUtil.getFarewellBySpecialDay(date);
            if (farewell === null) {
                farewell = farewellUtil.getFarewellByHour(date);
            }

            for (var index in resultHolder.output.text) {
                if (resultHolder.output.text[index] === undefined) continue;
                resultHolder.output.text[index] = resultHolder.output.text[index].replace(/\${farewell}/g, "\${" + farewell + "}");
            }
        }
    } catch (err) {
        resultHolder.debug.loadTimeDependantFarewell = {};
        resultHolder.debug.loadTimeDependantFarewell.fatalError = err.message;
    }

    return callback(null, resultHolder);
};
