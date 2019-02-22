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
var nodemailer = require('nodemailer');

var template = require('./template.js');

var sgMail = require('@sendgrid/mail');

var mailerConfig = require('../../../../helper/config.js').getConfig('mailer');

//SMTP mail server
/*var smtpTransport = require("nodemailer-smtp-transport");
var transporter = nodemailer.createTransport(smtpTransport({
    host : mailerConfig.originHost,
    port: mailerConfig.originPort,
    auth : {
        user : mailerConfig.originUser,
        pass : mailerConfig.originPass
    }
}));*/
// or for the gmail SMPT
//var transporter = nodemailer.createTransport('smtps:'+mailerConfig.originUser.+'@gmail.com:'+mailerConfig.originPass.+'@smtp.gmail.com');

exports.sendEmail = function(resultHolder, callback) {

    //load template
    var body = template.read();

    //update template with new values
    var now = moment_tz().tz("Europe/Berlin");
    var dateNow = now.format('DD.MM.YYYY');
    var timeNow = now.format('HH:mm:ss');

    body = body.replace("[date]", dateNow);
    body = body.replace("[time]", timeNow);

    //callDateTime
    var callDate = resultHolder.session.context.callZSMDate;
    var callHours = resultHolder.session.context.callZSMHours;
    body = body.replace("[callDate]", callDate);
    body = body.replace("[callHours]", callHours);
    //callNumber - should be asked and extracted from the dialog
    body = body.replace("[callNumber]", resultHolder.session.context.callZSMPhone);
    //prefix - she/he/it/..., should be asked and/or extracted from the dialog
    body = body.replace("[prefix]", "Frau/Herr");
    //secondName - should be asked and extracted from the dialog
    body = body.replace("[fullName]", resultHolder.session.context.callZSMfullName);

    //additional comment
    if (resultHolder.session.context.callZSMcomment) {
        body = body.replace("[comment]", resultHolder.session.context.callZSMcomment);
    } else {
        body = body.replace("[comment]", "-");
    }

    //styling of cells in table
    var style = "border: 1px solid black;border-collapse: collapse;padding: 10px;"
    //forming the chat history
    var count = resultHolder.session.messageId;
    var content = "<tr><th style='" + style + "'>Nr.</th><th style='" + style + "'>" + resultHolder.session.context.callZSMfullName + "</th><th>Eva</th><th style='" + style + "'>Erstellt</th></tr>";

    if (count >= 0 && resultHolder.session.feedback !== undefined) {
        for (var i = 0; i < count; i++) {
            var feedback = resultHolder.session.feedback[i];
            content += "<tr>"
            content += "<td style='" + style + "'>" + feedback.messageId + "</td>";
            content += "<td style='" + style + "'>" + feedback.question + "</td>";
            content += "<td style='" + style + "'>" + feedback.answer + "</td>";
            content += "<td style='" + style + "'>" + moment_tz(feedback.created).tz("Europe/Berlin").format('DD.MM.YYYY HH:mm:ss') + "</td>";
            content += "</tr>"
        }
    }

    body = body.replace("[chatHistory]", content);

    sgMail.setApiKey(mailerConfig.sendGridApiKey);

    var mailOptions = {
        to: mailerConfig.targetEmail,
        from: mailerConfig.originEmail,
        subject: mailerConfig.emailTopic,
        html: body
    };

    resultHolder.debug.mail.mailOptions = mailOptions;

    sgMail.send(mailOptions, function(error, info) {
        if (error) {
            callback(error, resultHolder);
        } else {
            callback(null, resultHolder)
        }
    });

    //prepare transporter
    // var transporter = nodemailer.createTransport({
    //  service: 'gmail',
    //  auth: {
    //    user: mailerConfig.originUser,
    //    pass: mailerConfig.originPass
    //  }
    // });
    //send the email
    //transporter.sendMail(mailOptions, function(error, info) {
    //   if (error) {
    //    callback(error, resultHolder);
    //  } else {
    //    callback(null, resultHolder)
    //  }
    // });
}
