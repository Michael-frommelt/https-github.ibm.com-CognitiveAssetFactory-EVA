/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

/**
 * This script is used to update the dialog nodes of the Watson Assistant with the answer text 
 * stored in the answer store. You can either use this script via the command line (node updateWA.js)
 * or if you use visual studio code as an editor via the launch.json configuration. For the last methode 
 * to work, copy the launch.json file from the update_wa directory in the newly created folder ".vscode" 
 * in the root directory. Then you can use the "Update Watson Assistant with answer text" configuration 
 * to debug the script. 
 * 
 * If the answers are stored in cloudant, please make sure to set db_url and db_api_key, if the answers 
 * are stored in mongo, please make sure to set db_uri and db_name in the launch.json 
 * configuration or the .env file (depending on how you are planning to use the script). 
 * 
 * You can specify the output field of the dialog node in which the answers will be written by 
 * configuring the target_parameter variable. Moreover you can specify if the answer ids should be 
 * written in this field, too, by setting the answer_id parameter to "true". Else set it to "false".
 * */

// Requirements
require('dotenv').config()
var Cloudant = require('@cloudant/cloudant')
var watson = require('watson-developer-cloud')
var mongoClient = require('mongodb').MongoClient;

// Get the Watson Assistant credentials
wa_credentials = {
  iam_apikey: process.env.wa_api_key,
  url: process.env.wa_url,
  version: process.env.wa_version
}

// Get the Watson Assistant
var assistant = new watson.AssistantV1(wa_credentials);

// Get the workspaces
var workspaces = {
  data: []
}
assistant.listWorkspaces(function (err, response) {
  if (err) {
    console.error(err);
  } else {
    // Get information for each workspace
    response["workspaces"].forEach(workspace => {
      workspaces.data[workspace["name"]] = {
        workspace_id: workspace["workspace_id"],
        workspace_name: workspace["name"]
      }
    });

    // Get the length of workspaces.data
    var workspaces_count = 0;
    for (workspace in workspaces.data) {
      workspaces_count = workspaces_count + 1;
    }

    // Split mongo and cloudant
    if (process.env.db_api_key) {
      // Get cloudant credentials
      db_credentials = {
        iam_apikey: process.env.db_api_key,
        url: process.env.db_url
      }
      // Call loadPlainText
      var loaded = 0;
      loadPlainTextCloudant(assistant, workspaces, db_credentials, process.env.target_parameter, process.env.answer_id, function (response) {
        console.log(response);
        loaded = loaded + 1;
        if (loaded == workspaces_count) {
          process.exit();
        }
      });
    } else {
      // Get cloudant credentials
      db_credentials = {
        db_uri: process.env.db_uri,
        db_name: process.env.db_name
      }
      // Call loadPlainText
      var loaded = 0;
      loadPlainTextMongo(assistant, workspaces, db_credentials, process.env.target_parameter, process.env.answer_id, function (response) {
        console.log(response);
        loaded = loaded + 1;
        if (loaded == workspaces_count) {
          process.exit();
        }
      });
    }


  }
});

/**
 * Get the corresponding answer store for all specified workspaces from the specified cloudant database and call the loadPlainText module
 * @param {*} assistant The watson assistant that contains the workspaces
 * @param {*} workspaces The workspaces to update
 * @param {*} db_credentials The credentials of the cloudant database that contains the answerstores
 * @param {*} target_parameter The parameter of the dialog node in which to write the answer text
 * @param {*} callback
 */
function loadPlainTextCloudant(assistant, workspaces, db_credentials, target_parameter, id, callback) {
  var loadPlainTextModule = require('./loadPlainTextCloudant.js');

  // Get the cloudant db
  var cloudant = Cloudant({
    url: db_credentials.url,
    iamApiKey: db_credentials.iam_apikey
  });

  // Get a list of all databases
  cloudant.db.list(function (err, data) {
    if (err) {
      return callback(err);
    } else {
      var databases = data;

      // For each workspace, find the matching answerstore and call loadPlainTextModule
      for (workspace in workspaces.data) {
        var answer_store_name = "answers_" + workspace.substring(workspace.indexOf('-') + 2, workspace.length).toLowerCase() + "_asset";
        for (database in databases) {
          if (answer_store_name == databases[database]) {
            console.log("Found answerstore (" + answer_store_name + ") for: " + workspace);
            var workspace_data = workspaces.data[workspace];
            loadPlainTextModule.run(cloudant, answer_store_name, assistant, workspace_data, target_parameter, id, function (response) {
              return callback(response);
            });
          }
        }
      }
    }
  })
}

/**
 * Get the corresponding answer store for all specified workspaces from the specified mongo database and call the loadPlainText module
 * @param {*} assistant The watson assistant that contains the workspaces
 * @param {*} workspaces The workspaces to update
 * @param {*} db_credentials The credentials of the mongo database that contains the answerstores
 * @param {*} target_parameter The parameter of the dialog node in which to write the answer text
 * @param {*} callback
 */
function loadPlainTextMongo(assistant, workspaces, db_credentials, target_parameter, id, callback) {
  var loadPlainTextModule = require('./loadPlainTextMongo.js');

  // Get the mongo db
  mongoClient.connect(db_credentials.db_uri, { useNewUrlParser: true }, function (err, client) {
    var mongo_db = client.db(db_credentials.db_name);

    // For each workspace, find the matching answerstore and call loadPlainTextModule
    for (workspace in workspaces.data) {
      var answer_store_name = "answers_" + workspace.substring(workspace.indexOf('-') + 2, workspace.length).toLowerCase() + "_asset";

      // Check whether the answerstore exists
      mongo_db.collection(answer_store_name, function (err, result) {
        if (err) {
          return callback(err)
        } else {
          console.log("Found answerstore (" + answer_store_name + ") for: " + workspace);
          var workspace_data = workspaces.data[workspace];
          loadPlainTextModule.run(mongo_db, answer_store_name, assistant, workspace_data, target_parameter, id, function (response) {
            return callback(response);
          });
        }
      });
    }
  });
}