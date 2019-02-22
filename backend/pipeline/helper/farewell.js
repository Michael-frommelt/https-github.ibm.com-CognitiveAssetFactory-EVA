/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
exports.getFarewellByHour = function(date) {
    var h = date.get('hour');
    var i; // iterator

    var farewellByHour = {};
    farewellByHour[0] = "farewell_night";
    farewellByHour[4] = "farewell_morning";
    farewellByHour[12] = "farewell_day";
    farewellByHour[18] = "farewell_evening";
    farewellByHour[22] = "farewell_night";

    var returnValue = "";

    var hTest = 0;
    hTest = 0; // hour to test for
    for (i in farewellByHour) {
        if (h > hTest) {
            if (i <= h) {
                hTest = i;
            }
        }
    }

    var res = farewellByHour[hTest]
    var DoW = date.day();
    // console.log("getFarewellByHour --> Dow = " + DoW);
    if ((DoW >= 5) || (DoW == 0)) {
    	res += "} ${farewell_weekend" // concat "by hour" and "weekend" farewell
    }

    return(res);
}

// abstraction: date-specific dictionary
exports.getFarewellBySpecialDay = function(d) {
    var tDay = d.get('date');
    var tMonth = d.get('month') + 1;
    var tYear = d.get('year');

    // YYYY-MM-DD
    var dateString = pad(tYear, 4) + '-' + pad(tMonth, 2) + '-' + pad(tDay, 2);
    E = getEaster(tYear);

    // dictionary for holiday events:
    // reg-ex support for date format YYYY-MM-DD
    // plus Easter-related format E[+-]NN

    var dict = {};

    dict['-01-01'] = 'farewell_newYear';
    dict['-05-01'] = 'farewell_generalHoliday';
    dict['-10-03'] = 'farewell_generalHoliday';

    dict['-12-24'] = 'farewell_xmas';
    dict['-12-25'] = 'farewell_xmas';
    dict['-12-26'] = 'farewell_xmas';
    dict['-12-31'] = 'farewell_silvester';

    // Easter-related holidays
    dict[easterDateString(E, -2)] = 'farewell_easterWeekend';
    dict[easterDateString(E, -1)] = 'farewell_easterWeekend';
    dict[easterDateString(E, 0)] = 'farewell_easterWeekend';
    dict[easterDateString(E, 1)] = 'farewell_easterWeekend';

    dict[easterDateString(E, 39)] = 'farewell_generalHoliday';
    dict[easterDateString(E, 49)] = 'farewell_pentecost';
    dict[easterDateString(E, 50)] = 'farewell_pentecost';
    dict[easterDateString(E, 60)] = 'farewell_generalHoliday';


    var s = null; // + JSON.stringify(dict);; // + E + easterDateString(E, -2);


    // browse through date-specific dictionairy
    for (key in dict) {
        var value = dict[key];
        //s += key + "/"; // debug, only
        if (dateString.match(new RegExp(key, 'g'))) {
            s = value;
        }
    }

    return (s);
}

// get the Easter Sunday of a specific year Y
// https://stackoverflow.com/questions/1284314/easter-date-in-javascript
// https://de.wikipedia.org/wiki/Gesetzliche_Feiertage_in_Deutschland
// https://de.wikipedia.org/wiki/Gau%C3%9Fsche_Osterformel
// [Wann ist Ostern? - PTB.de](http://www.ptb.de/cms/ptb/fachabteilungen/abt4/fb-44/ag-441/darstellung-der-gesetzlichen-zeit/wann-ist-ostern.html)
function getEaster(Y) {
    var C = Math.floor(Y / 100);
    var N = Y - 19 * Math.floor(Y / 19);
    var K = Math.floor((C - 17) / 25);
    var I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
    I = I - 30 * Math.floor((I / 30));
    I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
    var J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
    J = J - 7 * Math.floor(J / 7);
    var L = I - J;
    var M = 3 + Math.floor((L + 40) / 44);
    var D = L + 28 - 31 * Math.floor(M / 4);

    //   return padout(M) + '.' + padout(D);
    return (new Date(Y, M - 1, D));
}

// get a YYYY-MM-DD string with delta days distance to easterDate
function easterDateString(easterDate, delta) {
    var nd = new Date(); //new Date();
    nd.setTime(easterDate.getTime() + (delta * 24 * 60 * 60 * 1000));
    return (pad(nd.getFullYear(), 4) + '-' + pad(nd.getMonth() + 1, 2) + '-' + pad(nd.getDate(), 2));
}

// pad a number with leading zeros (0)
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}
