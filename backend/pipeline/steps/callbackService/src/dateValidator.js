/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
var moment_tz = require('moment-timezone');
var moment = require('moment');
var farewellUtil = require('../../../helper/farewell.js');

exports.getDates = function() {

    //date block
    var date = moment_tz().tz("Europe/Berlin");
    var dateFormat = 'dddd, D.M.';
    var countdown = 5;
    var dateCounter = date.clone();

    var validDates = [];

    if ((date.hour() === 17 && date.minute() >= 30) || date.hour() >= 18) {
        dateCounter = dateCounter.add(1, 'days');
    }

    //push to valid days to the array
    while (countdown > 0) {
        var DoW = dateCounter.day(); // day of the week, 0 = SUN, 1 = MON ...
        if ((DoW > 0) && (DoW < 6)) {
            if (farewellUtil.getFarewellBySpecialDay(dateCounter) == null) { // is the date a known holiday?
                if (dateCounter.isSame(date, 'day')) {
                    validDates.push("Heute, " + dateCounter.locale('de').format(dateFormat));
                } else {
                    validDates.push(dateCounter.locale('de').format(dateFormat));
                }
                countdown -= 1;
            }
        }
        dateCounter = dateCounter.add(1, 'days');
    }
    //

    return validDates;
}

exports.getHours = function(dateString) {

    var date;

    //time block
    if (dateString.indexOf("Heute") > -1 || dateString.indexOf("heute") > -1) {
        date = moment_tz().tz("Europe/Berlin");
    } else {
        dateString = dateString.substring(dateString.indexOf(",") + 2, dateString.length);
        console.log("XXXXXXXXXX dateString:" + dateString);

        date = moment(dateString, "D.M.", "de", true);
        console.log("XXXXXXXXXX date:" + date);

        if (!date.isValid()) {
            return null;
        }
    }


    var dateCounter = date.clone();

    var dateFormat = 'dddd, D.M. [um] H:mm [Uhr]';
    var countdown = 5;

    var validHours = [];


    if (dateCounter.hour() < 7) {
        dateCounter.hour(7);
    }

    var validDate = false;
    while (!validDate) { // increase day until we find a valid date, not SAT/SUN/holiday
        var DoW = dateCounter.day(); // day of the week, 0 = SUN, 1 = MON ...
        if ((DoW > 0) && (DoW < 6) && (farewellUtil.getFarewellBySpecialDay(dateCounter) == null)) { // is the date a known holiday?
            validDate = true;
        } else {
            dateCounter = dateCounter.add(1, 'days');
        }
    }

    if (dateCounter.isSame(date)) { // are we still at the same date and time?
        validHours.push("In den nächsten 30 Minuten");
    }
    if (dateCounter.isSame(date, 'day')) { // are we still at the same date
        dateCounter.add(1, 'hours'); // skip to next hour ...
    }

    //push valid hours to array
    var hour = dateCounter.hour();
    while (hour <= 17) {
        validHours.push(hour + ":00 - " + (hour + 1) + ":00");
        dateCounter.add(1, 'hours');
        hour = dateCounter.hour();
    }

    return validHours;
}
