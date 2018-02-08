/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('eva.answerStore').service('AnswerStoreService', ['$http', '$q', '$window', 'Upload', 'ConfigService',
  function($http, $q, $window, Upload, ConfigService) {
    var answerEndpoint = '/api/answer/';
    var answerPropertiesEndpoint = '/api/answerproperty/';
    var answerSetEndpoint = '/api/answerset/';
    var answerVersionEndpoint = '/api/answerversion/';

    var dataUpdateInterval = 300000; //ms, default value
    ConfigService.getConfig('answerStore').then(function(config) {
      if (config.frontend.updateInterval) {
        dataUpdateInterval = config.frontend.updateInterval * 1000; // converting s to ms
      }
    });

    // caches and cache timestamps
    var answers = {};
    var answerProperties = [];
    var answersTimestamps = {};
    var answerPropertiesTimestamp = 0;

    var that = this;

    this.getAnswerProperties = function(forceReload) {
      /* if (!forceReload && (Date.now() - answerPropertiesTimestamp) <= dataUpdateInterval) {
        return $q.resolve(answerProperties);
      } else { */
      return $http.get(answerPropertiesEndpoint).then(function(getResult) {
        answerProperties.splice(0, answerProperties.length);
        for (var i = 0; i < getResult.data.length; i++) {
          answerProperties.push(getResult.data[i]);
        }
        answerPropertiesTimestamp = Date.now();
        return answerProperties;
      });
      //}
    };

    this.saveAnswerProperty = function(answerProperty) {
      if (!answerProperty.hasOwnProperty('name')) {
        return $q.reject('Invalid answer property format');
      }
      return $http.post(answerPropertiesEndpoint + answerProperty.name, answerProperty).then(function() {
        for (var i = 0; i < answerProperties.length; i++) {
          if (answerProperties[i].name === answerProperty.name) {
            answerProperties[i] = answerProperty;
            return true;
          }
        }
        answerProperties.push(answerProperty);
      });
    };

    this.deleteAnswerProperty = function(answerPropertyName) {
      return $http.delete(answerPropertiesEndpoint + answerPropertyName).then(function() {
        for (var i = 0; i < answerProperties.length; i++) {
          if (answerProperties[i].name === answerPropertyName) {
            answerProperties.splice(i, 1);
            return true;
          }
        }
      });
    };

    this.getAnswers = function(answerSetId, forceReload) {
      /* if (!forceReload && answersTimestamps[answerSetId] && (Date.now() - answersTimestamps[answerSetId]) <= dataUpdateInterval) {
        return $q.resolve(answers[answerSetId]);
      } else { */
      return $http.get(answerEndpoint + answerSetId).then(function(getResult) {
        if (!answers[answerSetId]) {
          answers[answerSetId] = [];
        }
        answers[answerSetId].splice(0, answers[answerSetId].length);
        for (var i = 0; i < getResult.data.length; i++) {
          answers[answerSetId].push(getResult.data[i]);
        }
        answersTimestamps[answerSetId] = Date.now();
        return answers[answerSetId];
      });
      //}
    };

    this.getAnswer = function(answerSetId, answerId, forceReload) {
     /*  if (!forceReload && answersTimestamps[answerSetId] && (Date.now() - answersTimestamps[answerSetId]) <= dataUpdateInterval) {
        for (var i = 0; i < answers[answerSetId].length; i++) {
          if (answers[answerSetId][i].answerId === answerId) {
            return $q.resolve(answers[answerSetId][i]);
          }
        }
      } else { */
      return $http.get(answerEndpoint + answerSetId + '/' + answerId).then(function(getResult) {
        var answer = getResult.data;
        // only update the cache if we are in a situation where we actually use it
        if (answers[answerSetId]) {
          for (var i = 0; i < answers[answerSetId].length; i++) {
            if (answers[answerSetId][i].answerId === answer.answerId) {
              answers[answerSetId][i] = answer;
              return answer;
            }
          }
          answers[answerSetId].push(answer);
        }
        return answer;
      });
      // }
    };

    this.saveAnswer = function(answerSetId, answer) {
      if (!answer.hasOwnProperty('answerId')) {
        return $q.reject('Invalid answer format');
      }
      return $http.post(answerEndpoint + answerSetId + '/' + answer.answerId, answer).then(function() {
        // only update the cache if we are in a situation where we actually use it
        if (answers[answerSetId]) {
          for (var i = 0; i < answers[answerSetId].length; i++) {
            if (answers[answerSetId][i].answerId === answer.answerId) {
              answers[answerSetId][i] = answer;
              return true;
            }
          }
          answers[answerSetId].push(answer);
        }
      });
    };

    this.deleteAnswer = function(answerSetId, answerId) {
      return $http.delete(answerEndpoint + answerSetId + '/' + answerId).then(function() {
        // only update the cache if we are in a situation where we actually use it
        if (answers[answerSetId]) {
          for (var i = 0; i < answers[answerSetId].length; i++) {
            if (answers[answerSetId][i].answerId === answerId) {
              answers[answerSetId].splice(i, 1);
              return true;
            }
          }
        }
      });
    };

    this.getAnswerSets = function() {
      return $http.get(answerSetEndpoint).then(function(getResult) {
        var answerSets = getResult.data;
        return answerSets;
      });
    };

    this.getVersions = function(answerSetId, answerId) {
      return $http.get(answerVersionEndpoint + answerSetId + '/' + answerId).then(function(getResult) {
        var answerVersions = getResult.data;
        return answerVersions;
      });
    };

    this.getVersionsMarkedForDeletion = function(answerSetId) {
      return $http.get(answerVersionEndpoint + 'deleted/' + answerSetId).then(function(getResult) {
        var versionsForDeletedAnswers = getResult.data;
        return versionsForDeletedAnswers;
      });
    };

    this.unmarkVersionForDeletion = function(answerSetId, answerId) {
      return $http.delete(answerVersionEndpoint + 'deleted/' + answerSetId + '/' + answerId);
    };

    this.importAnswers = function(answerSetId, file, override) {
      return Upload.upload({
        url: answerEndpoint + 'import/' + answerSetId,
        params: { override: override },
        data: { uploadFile: file }
      });
    };

    this.exportAnswers = function(answerSetId, fileType, language) {
      $window.open(answerEndpoint + 'export/' + answerSetId + '?type=' + fileType + '&lang=' + language);
    };
  }
]);
