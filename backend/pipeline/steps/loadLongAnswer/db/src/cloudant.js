/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
exports.getAnswer = function(containerName, answerId) {
  return new Promise(function(resolve, reject) {
    globalDatabase.connection.use(containerName).find({
        "selector": {
            "answerId": answerId
        },
        "fields": [
            "answerId",
            "answerOptions",
            "answerProposals"
        ]
    }, function (err,result) {
      if(err) {
        reject(err);
      } else {
        resolve(result.docs[0]);  
      }
    });
  });
};
