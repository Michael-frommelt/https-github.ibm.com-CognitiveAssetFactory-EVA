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
 * Updates the specified workspaces of the specified watson assistant with the answer text from the specified answerstore from the specified mongo database
 * @param {*} mongo_db The mongo database that contains the answer store
 * @param {*} answerstore The name of the mongo db collection that stores the answer texts.
 * @param {*} assistant The watson assistant that contains the workspaces
 * @param {*} workspace The workspace to update
 * @param {*} target_parameter The parameter of the dialog node in which to write the answer text
 * @param {*} callback
 */
exports.run = function (mongo_db, answerstore, assistant, workspace, target_parameter, id, callback) {

  // Get the workspace info
  var conversation_workspace = workspace.workspace_id;
  var conversation_workspace_name = workspace.workspace_name

  console.log("Called loadPlainText for: " + conversation_workspace_name);

  //creates the wrapper for the watson assistant connection
  var params = {
    export: true,
    workspace_id: conversation_workspace
  };

  // Get the workspace
  assistant.getWorkspace(params, function (err, response) {
    if (err) {
      return callback('Error fetching ' + conversation_workspace_name + 'workspace: ' + err);
    }
    var workspace = response;

    if (workspace.dialog_nodes.length === 0) {
      return callback('Workspace had no dialog nodes');
    }
    console.log("Got workspace information for: " + conversation_workspace_name + ". " + workspace.dialog_nodes.length + " dialog nodes to iterate over");

    // Get a list of all answers in the answerstore
    mongo_db.collection(answerstore).find({}).toArray(function (err, result) {
      if (err) {
        return callback('Error while fetching data from database' + err);
      }
      if (result) {
        var answers = result;
        console.log("Got data from: " + answerstore);

        // Iterate over all nodes in the dialog tree to get their answer ids
        for (var i = 0; i < workspace.dialog_nodes.length; i++) {

          // Get the answer id for every dialog node that has one and update it with the answer text
          (function () {
            var ii = i;
            if (typeof workspace.dialog_nodes[ii].output !== 'undefined' && workspace.dialog_nodes[ii].output)
              var answer_id = workspace.dialog_nodes[ii].output.answer_id
            else
              var answer_id = 'undefined';

            //Get all found answer ids
            if (answer_id !== 'undefined' && answer_id) {

              //Clean the answer id
              var find = '[\[\]]';
              var re = new RegExp(find, 'g');
              answer_id = answer_id.toString()
              answer_id = answer_id.replace(re, '');
              if (answer_id.indexOf('\<\?') != -1) {
                answer_id = answer_id.substring(answer_id.indexOf('\'') + 1);
                answer_id = answer_id.substring(0, answer_id.indexOf('\''));
              }

              // Get the answer text for the given answer id out of the answer store
              var answerText = 'undefined';
              for (answer in answers) {
                if (answers[answer].answerId == answer_id) {
                  if (id == "true") {
                    answerText = answer_id + " - " + answers[answer].answerOptions[0].answerText;
                  } else {
                    answerText = answers[answer].answerOptions[0].answerText;
                  }
                }
              }

              // Write the answer text into the dialog nodes target parameter
              if (!workspace.dialog_nodes[ii].output.hasOwnProperty(target_parameter)) {
                workspace.dialog_nodes[ii].output[target_parameter] = {};
              }
              workspace.dialog_nodes[ii].output[target_parameter].values = [];
              workspace.dialog_nodes[ii].output[target_parameter].values.push(answerText);
            }
          })();
        }

        //Update the workspace with the overwritten dialog nodes
        var dialog_nodes = workspace.dialog_nodes;
        params = {
          workspace_id: conversation_workspace,
          dialog_nodes: dialog_nodes
        };
        console.log("Created new dialog_nodes for: " + conversation_workspace_name);

        assistant.updateWorkspace(params, function (err, response) {
          if (err) {
            return callback('Error updating ' + JSON.stringify(params.workspace_id) + ':' + err);
          }
          else if (response) {
            return callback('Updated ' + JSON.stringify(response.name) + ' (' + JSON.stringify(response.workspace_id) + ') at:' + getDateTime());
          }
        }); //updateWorkspace
      } // if (result)
    }); // mongo_db.collection(answerstore).find({}).toArray()
  }); // conversation.getWorkspace

  /**
   * Returns current timestamp
   */
  function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

  }
}