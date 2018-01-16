/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
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
