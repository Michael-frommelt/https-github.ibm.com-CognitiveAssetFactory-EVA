/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('eva.conversationFeedback').service('ConversationFeedbackService', ['$http', '$q',
  function($http, $q) {
    var conversationFeedbackEndpoint = '/api/conversation-feedback/';
    
    this.getConversationFeedback = function(filter, limit, page, sorting) {
      return $http.post(conversationFeedbackEndpoint + 'get', {
        filter: filter,
        limit: limit,
        page: page,
        sorting: sorting,
      });
    };

    this.getDistinctColumnValues = function(columnName) {
      return $http.post(conversationFeedbackEndpoint + 'distinctcolumnvalues', {
        columnName: columnName,
      });
    };

    this.countConversationFeedback = function(filter) {
      return $http.post(conversationFeedbackEndpoint + 'count', {
        filter: filter,
      });
    };

    this.saveConversationFeedback = function(clientId, rating, comment) {
      return $http.post(conversationFeedbackEndpoint + 'save', {
        clientId: clientId,
        rating: rating,
        comment: comment,
      });
    };

    this.generateConversationFeedbackExport = function(filter, sorting) {
      return $http.post(conversationFeedbackEndpoint + 'export/generate', {
        filter: filter,
        sorting: sorting,
      }).then(function(response) {
        return response.data;
      });
    };
  
    this.getConversationFeedbackExportProgress = function() {
      return $http.get(conversationFeedbackEndpoint + 'export/progress').then(function(response) {
        return response.data.progress;
      }, function(error) {
        if (error.status === 404) return null;
        return $q.reject(error);
      });
    };
    
    this.cancelConversationFeedbackExport = function() {
      return $http.get(conversationFeedbackEndpoint + 'export/cancel');
    };
  }
]);