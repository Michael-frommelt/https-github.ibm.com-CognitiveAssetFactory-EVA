/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
// ##############################
// ## IMPORTS                  ##
// ##############################
var db = require('./db/db.js').getDatabase();
var conversationConfig = require('../../helper/config.js').getConfig('conversation');
var guidingConceptConfig = require('../../helper/config.js').getConfig('guidingConcept');
var config = {
    conversation: conversationConfig,
    guidingConcept: guidingConceptConfig
};

// ##############################
// ## ROUTES                   ##
// ##############################

exports.getQuestions = function(entities, intents, jargon, callback) {
  getQuestionsByEntities(entities, intents, jargon, function(err, result, answer_id, entity) {

    if (err) return callback(err, null, null, null, result);

    if (result.length == 0) {

      getQuestionsByIntents(intents, jargon, function(err, result) {
        if (err) return callback(err, result);

        var answer_id = ["Anything_else_2"];
        var answer_proposals = [];

        result.forEach(function(item) {
          answer_proposals.push(item.text);
        });

        return callback(null, answer_id, answer_proposals, null, result);
      });
    } else if (result.length == 1) {

        var entity = entity;
        var answer_id = answer_id;
        var answer_proposals = [];

        getQuestionsByIntents(intents, jargon, function(err, intentResult) {
          if (err) return callback(err, intentResult);



          result.forEach(function(item) {
            answer_proposals.push(item.text);
          });

          answer_proposals.push(intentResult[0].text);
          answer_proposals.push(intentResult[1].text);

          return callback(null, answer_id, answer_proposals, entity, result);
      });

  } else if (result.length == 2) {

        var entity = entity;
        var answer_id = answer_id;
        var answer_proposals = [];

        getQuestionsByIntents(intents, jargon, function(err, intentResult) {
          if (err) return callback(err, intentResult);

          result.forEach(function(item) {
            answer_proposals.push(item.text);
          });
          answer_proposals.push(intentResult[0].text);

          return callback(null, answer_id, answer_proposals, entity, result);
      });

  } else if (result.length == 3) {

      var entity = entity;
      var answer_id = answer_id;
      var answer_proposals = [];

      result.forEach(function(item) {
        answer_proposals.push(item.text);
      });

      return callback(null, answer_id, answer_proposals, entity, result);

  } else if (result.length >= 4) {

      var entity = entity;
      var answer_id = answer_id;
      var answer_proposals = [];

      result.slice(0, 3).forEach(function(item) {
          answer_proposals.push(item.text);
      })

      return callback(null, answer_id, answer_proposals, entity, result);

  }
  });
}

function getQuestionsByEntities(entities, intents, jargon, callback) {
  if (jargon == null) jargon = "formell";
  var keywordSearch = [];

  for (var i = 0; i < entities.length; i++) {
    keywordSearch.push(entities[i]['entity']);
    keywordSearch.push(entities[i]['entity'] + ":" + entities[i]['value']);
  }

  db.getQuestionsByEntities(keywordSearch, jargon, function(result) {
    var questions = [];
        for (var i = 0; i < result.length; i++) {
          var question = getBestMatchForIntent(result[i]['result'], entities, questions);
          if (question != null) {
              question.intent = result[i]['_id']['intent'];
              questions.push(question);
              questions = sortByIntent(intents, questions);
          }

        }

        var answer_id = getAnswerIdForAnswer(questions);
        var entity = getEntityStringForAnswer(questions);

            var defExists = false;
            questions.forEach(function(question, questionIndex) {
                if(defExists == true) {
                    questions.splice(questionIndex, 1);
                } else if(question.intent.search('definition') != -1) {
                    defExists = true;
                };
            })

    return callback(null, questions, answer_id, entity);
  }, function(errCode, errReason) {
    console.log("An error occurred while retrieving the question proposals: " + errReason);
    return callback({
      code: errCode,
      message: errReason
    }, null);
  });
}

function getQuestionsByIntents(intents, jargon, callback) {

  if (intents[0].intent != config.conversation.offtopic) {
    if (jargon == null) jargon = "formell";

    var keywordSearch = [];

    for (var i = 0; i < intents.length; i++) {
      if (intents[i]['confidence'] > config.guidingConcept.anything_else.minimumConfidence) {
        keywordSearch.push(intents[i]['intent']);
      }
    }

    if (keywordSearch.length > 0) {

      db.getQuestionsByIntents(keywordSearch, jargon, function(result) {
        var questions = [];
        for (var i = 0; i < result.length; i++) {
          var question = getAnswerOptionForIntent(result[i]);
          if (question != null) questions.push(question);
        }

        questions = sortByIntent(intents, questions);

        questions = questions.concat(getRandomDefaultQuestions(3 - questions.length));

        return callback(null, questions);
      }, function(errCode, errReason) {
        console.log("An error occurred while retrieving the question proposals: " + errReason);
        return callback({
          code: errCode,
          message: errReason
        }, null);
      });
    } else {
      var questions = [];

      questions = questions.concat(getRandomDefaultQuestions(3));

      return callback(null, questions);
    }
  } else {
    var questions = [];

    questions = questions.concat(getRandomDefaultQuestions(3));

    return callback(null, questions);
  }
}

function getEntityStringForAnswer(result) {
  var topics = [];

  result.forEach(function(item) {
    topics.push(item.entityValue);
  });

  topics = topics.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  });

  if (topics.length > 1) {
    var topicsString = "";
    for (var i = 0; i < topics.length; i++) {
      if (i != topics.length - 1) {
        topicsString += topics[i] + ", ";
      } else {
        return topicsString.substring(0, topicsString.length - 2) + " und " + topics[i];
      }
    }
  } else {
    return topics[0];
  }
}

function getAnswerIdForAnswer(result) {
  var topics = [];

  result.forEach(function(item) {
    topics.push(item.entityValue);
  });

  topics = topics.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  });

  if (topics.length > 1) {
    var topicsString = "";
    for (var i = 0; i < topics.length; i++) {
      if (i != topics.length - 1) {
        topicsString += topics[i] + ", ";
      } else {
        return ["callFindQuestions_1_multiple"];
      }
    }
  } else {
    return ["callFindQuestions_1_single"];
  }
}

function getBestMatchForIntent(proposals, entities, currentQuestions) {

  //check if question for entity value and additional entities exists
  for (var i = 0; i < entities.length; i++) {
    var entityValue = entities[i]['entity'] + ":" + entities[i]['value'];
    for (var j = 0; j < proposals.length; j++) {
      var proposal = proposals[j];
      if (proposal.mainEntities.indexOf(entityValue) != -1 && proposal.additionalEntities.length > 0) {
        if (proposal.additionalEntities.length > 0) {
          var concatenatedEntities = [];
          for (var k = 0; k < entities.length; k++) {
            concatenatedEntities.push(entities[k]['entity'] + ":" + entities[k]['value']);
          }
          var intersection = intersect(proposal.additionalEntities, concatenatedEntities);
          if (proposal.additionalEntities.length === intersection.length) {
              var exist = false;
              var questionText = proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']);

              for (var j = 0; j < currentQuestions.length; j++) {
                  if (currentQuestions[j].text == questionText) exist = true;
              }

              if (exist == false) {
                  return questionObject = {
                    text: proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']),
                    entityValue: entities[i]['value']
                  }
              }
          }
        }
      }
    }
  }

  //check if question for entity value exists
  for (var i = 0; i < entities.length; i++) {
    var entityValue = entities[i]['entity'] + ":" + entities[i]['value'];
    for (var j = 0; j < proposals.length; j++) {
      var proposal = proposals[j];
      if (proposal.mainEntities.indexOf(entityValue) != -1) {
          var exist = false;
          var questionText = proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']);

          for (var j = 0; j < currentQuestions.length; j++) {
              if (currentQuestions[j].text == questionText) exist = true;
          }

          if (exist == false) {
              return questionObject = {
                text: proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']),
                entityValue: entities[i]['value']
              }
          }
      }
    }
  }

  //check if question for entity exists
  for (var i = 0; i < entities.length; i++) {
    var entity = entities[i]['entity'];
    for (var j = 0; j < proposals.length; j++) {
      var proposal = proposals[j];
      if (proposal.mainEntities.indexOf(entity) != -1) {
          var exist = false;
          var questionText = proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']);

          for (var j = 0; j < currentQuestions.length; j++) {
              if (currentQuestions[j].text == questionText) exist = true;
          }

          if (exist == false) {
              return questionObject = {
                text: proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'].replace('${entity}', entities[i]['value']),
                entityValue: entities[i]['value']
              }
          }
      }
    }
  }

  return null;
}

function getAnswerOptionForIntent(proposal) {
  return questionObject = {
    text: proposal.options[Math.floor(Math.random() * proposal.options.length)]['text'],
    intent: proposal.intent
  }
}

function getRandomDefaultQuestions(missingQuestionsTotal) {
  var temp = config.guidingConcept.anything_else.default_answer_proposals.slice(0);
  var questions = [];

  for (var i = 0; i < (missingQuestionsTotal > temp.length ? temp.length : missingQuestionsTotal); i++) {
    var randomIndex = Math.floor(Math.random() * temp.length);
    var questionCluster = temp[randomIndex];
    temp.splice(randomIndex, 1);
    questions.push({
      text: questionCluster[Math.floor(Math.random() * questionCluster.length)],
      intent: null
    });
  }

  return questions;
}

function sortByIntent(intents, questions) {
  var sortedQuestions = [];

  for (var i = 0; i < intents.length; i++) {
    for (var j = 0; j < questions.length; j++) {
      if (intents[i]['intent'] == questions[j]['intent']) {
        sortedQuestions.push(questions[j]);
        questions.splice(j, 1);
        break;
      }
    }
  }

  sortedQuestions = sortedQuestions.concat(questions);

  return sortedQuestions;
}

function intersect(a, b) {
  var t;
  if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
  return a.filter(function(e) {
    return b.indexOf(e) > -1;
  }).filter(function(e, i, c) { // extra step to remove duplicates
    return c.indexOf(e) === i;
  });
}
