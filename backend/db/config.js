/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

const ERROR_INSUFFICIENT_INFORMATION = "Credentials provided for globalDatabase.type = '" + globalDatabase.type + "' not sufficient for connection.";
const ERROR_NO_DATABASE_CONFIG = "No database config information available for globalDatabase.type = '" + globalDatabase.type + "'.";

var vcap_services = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : undefined;

var dbconfig = {
    credentials: {},
    containers: {},
};

//credentials setup
if (globalDatabase.type === "mongodb") {

    if (vcap_services && vcap_services['compose-for-mongodb'] && vcap_services['compose-for-mongodb'].length > 0 && vcap_services['compose-for-mongodb'][0].credentials) {
        var mongodb_credentials = vcap_services['compose-for-mongodb'][0].credentials;
        dbconfig.credentials.uri = mongodb_credentials.uri;
        dbconfig.credentials.ca_certificate_base64 = mongodb_credentials.ca_certificate_base64;
    } else {
        var uri = process.env.DB_URI ? process.env.DB_URI : undefined;
        var ca_certificate = process.env.DB_CA_CERTIFICATE ? process.env.DB_CA_CERTIFICATE : undefined;

        if (uri && ca_certificate) {
            dbconfig.credentials.uri = uri;
            dbconfig.credentials.ca_certificate_base64 = ca_certificate;
        } else {
            throw new Error(ERROR_INSUFFICIENT_INFORMATION);
        }
    }

    dbconfig.credentials.instance = process.env.DB_NAME ? process.env.DB_NAME : "evawatson";

} else if (globalDatabase.type === "cloudant") {

    if (vcap_services && vcap_services['cloudantNoSQLDB'] && vcap_services['cloudantNoSQLDB'].length > 0 && vcap_services['cloudantNoSQLDB'][0].credentials) {
        var cloudant_credentials = vcap_services['cloudantNoSQLDB'][0].credentials;
        dbconfig.credentials.account = cloudant_credentials.username;
        dbconfig.credentials.password = cloudant_credentials.password;
    } else {
        var username = process.env.DB_USERNAME ? process.env.DB_USERNAME : undefined;
        var password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD : undefined;

        if (username && password) {
            dbconfig.credentials.account = username;
            dbconfig.credentials.password = password;
        } else {
            throw new Error(ERROR_INSUFFICIENT_INFORMATION);
        }
    }

} else {
    throw new Error(ERROR_NO_DATABASE_CONFIG);
}

//containers setup
dbconfig.containers.users = "users";
dbconfig.containers.conversation_logs = "conversation_logs";
dbconfig.containers.clients = "clients";
dbconfig.containers.config = "config";
dbconfig.containers.test_results = "test_results";
dbconfig.containers.test_files = "test_files";
dbconfig.containers.test_sessions = "test_sessions";
dbconfig.containers.variables = "variables";
dbconfig.containers.apps = "apps";
dbconfig.containers.sessions = "sessions";
dbconfig.containers.sessionsFacebook = "sessions_facebook";
dbconfig.containers.sessionsAlexa = "sessions_alexa";
dbconfig.containers.profanityList = "profanity";
dbconfig.containers.questionProposals = "question_proposals";
dbconfig.containers.kfold = "kfold_results";
dbconfig.containers.roles = "roles";
dbconfig.containers.conversationFeedback = "conversation_feedback";
dbconfig.containers.view_result_testing = "view_result_testing";
dbconfig.containers.testView = "test";

globalDatabase.config = dbconfig;
module.exports = dbconfig;
