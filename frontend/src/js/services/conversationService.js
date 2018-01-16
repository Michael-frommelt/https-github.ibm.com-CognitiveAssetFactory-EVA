/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
// conversation service
.service('conversationService', ['$http', '$q', function($http, $q) {
  // return public API.
  return ({
    getFirstMessage: getFirstMessage,
    getFeedback: getFeedback,
    countFeedback: countFeedback,
    distinctFeedback: distinctFeedback,
    generateFeedbackExport: generateFeedbackExport,
    getFeedbackExportProgress: getFeedbackExportProgress,
    cancelFeedbackExport: cancelFeedbackExport,
    sendQuestionAndReceiveAnswer: sendQuestionAndReceiveAnswer,
    saveFeedback: saveFeedback,
    updateFeedback: updateFeedback,
    deleteFeedback: deleteFeedback,
    getLongAnswerById: getLongAnswerById,
    getClientStatistic: getClientStatistic,
    getUserStatistic: getUserStatistic,
    getConversationsByDay: getConversationsByDay,
    getConversationsByHour: getConversationsByHour,
    getConversationsLongterm: getConversationsLongterm,
    getMessagesStatistic: getMessagesStatistic,
    getMessagesPerUser: getMessagesPerUser,
    getTopIntentStatistic: getTopIntentStatistic,
    getAnswerFromStatistic: getAnswerFromStatistic,
    saveConversationFeedback: saveConversationFeedback,
  });


//##################################### HTTP-CALLS FOR THE CONVERSATION #######################################
//############################################################################################################

  // request first message of dialog with given dialog id
  function getFirstMessage(clientId) {
    var request = $http({
      method: "POST",
      url: '/api/message',
      data: {
        clientId: clientId,
        input: {
        }
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function getLongAnswerById(clientId, answerId) {
    return $http.get('/api/answer/'+clientId+'/get/'+answerId).then(handleSuccess, handleError);
  }

  function sendQuestionAndReceiveAnswer(clientId, context, text) {
    var request = $http({
      method: "POST",
      url: '/api/message',
      data: {
        context: context,
        input: {
          text: text
        },
        clientId: clientId
      }
    });

    return (request.then(handleSuccess, handleError));
  }


//##################################### Reporting - Feedback #################################################
//############################################################################################################

  // get collected feedback of one instance
  function getFeedback(filter, limit, page, sorting) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/get',
      data: {
        filter: filter,
        limit: limit,
        page: page,
        sorting: sorting
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function countFeedback(filter) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/count',
      data: {
        filter: filter
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function distinctFeedback(columnId) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/distinct',
      data: {
        columnId: columnId
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  // store user feedback on given answer together with additional data in database
  function saveFeedback(clientId, messageId, feedback, comment, reason) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/save',
      data: {
        clientId: clientId,
        messageId: messageId,
        feedback: feedback,
        comment: comment,
        reason: reason
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function updateFeedback(feedbackId, update) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/admin/update',
      data: {
        feedbackId: feedbackId,
        update: update
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function deleteFeedback(feedbackId) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/admin/delete',
      data: {
        feedbackId: feedbackId
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function generateFeedbackExport(filter, sorting) {
    return $http.post('/api/feedback/export/generate', {
      filter: filter,
      sorting: sorting,
    }).then(handleSuccess, handleError);
  }

  function getFeedbackExportProgress() {
    return $http.get('/api/feedback/export/progress').then(function(response) {
      return response.data.progress;
    }, function(error) {
      if (error.status === 404) return null;
      return $q.reject(error);
    }).catch(handleError);
  }

  function cancelFeedbackExport() {
    return $http.get('/api/feedback/export/cancel').then(handleSuccess, handleError);
  }

  // store user feedback on chat experience
  function saveConversationFeedback(comment, rating, clientId) {
    var request = $http({
      method: "POST",
      url: '/api/conversation-feedback/save',
      data: {
        comment: comment,
        rating: rating,
        clientId: clientId
      }
    });

    return (request.then(handleSuccess, handleError));
  }


//##################################### Reporting - Statistics ###############################################
//############################################################################################################

 // get statistic data per client
  function getClientStatistic(filter) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/clientStatistic',
      data: {
        filter: filter
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  // get statistic for number of messages
  function getMessagesStatistic(clientId) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/messagesStatistic',
      data: {
        clientId: clientId
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  // get statistic data per intent
  function getTopIntentStatistic(clientId, start, end) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/topIntentStatistic',
      data: {
        clientId: clientId,
        start: start,
        end: end
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  // get statistic for answer from
  function getAnswerFromStatistic(clientId, start, end) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/answerFromStatistic',
      data: {
        clientId: clientId,
        start: start,
        end: end
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  // get statistic data per user
  function getMessagesPerUser(clientId, start, end) {
    var request = $http({
      method: "POST",
      url: '/api/feedback/messagesPerUser',
      data: {
        clientId: clientId,
        start: start,
        end: end
      }
    });

    return (request.then(handleSuccess, handleError));
  }

  function getUserStatistic(clientId, start) {
    var data = {
      clientId: clientId
    }

    if (start) {
      data.start = start;
    }

    var request = $http({
      method: "POST",
      url: '/api/feedback/userStatistic',
      data: data
    });

    return (request.then(handleSuccess, handleError));
  }

  function getConversationsByDay(clientId, start, end) {
    var data = {
      clientId: clientId
    }

    if (start && end) {
      data.start = start;
      data.end = end;
    }

    var request = $http({
      method: "POST",
      url: '/api/feedback/getConversationsByDay',
      data: data
    });

    return (request.then(handleSuccess, handleError));
  }

  function getConversationsByHour(clientId, start, end) {
    var data = {
      clientId: clientId
    }

    if (start && end) {
      data.start = start;
      data.end = end;
    }

    var request = $http({
      method: "POST",
      url: '/api/feedback/getConversationsByHour',
      data: data
    });

    return (request.then(handleSuccess, handleError));
  }

  function getConversationsLongterm(clientId, start, end) {
    var data = {
      clientId: clientId
    }

    if (start && end) {
      data.start = start;
      data.end = end;
    }

    var request = $http({
      method: "POST",
      url: '/api/feedback/getConversationsLongterm',
      data: data
    });

    return (request.then(handleSuccess, handleError));
  }


//##################################### CALLBACKS ############################################################
//############################################################################################################

  function handleError(response) {
    if(response.status === 401) {
      return ($q.reject("You're not logged in. Please reload and log in again."));
    }
    if (!angular.isObject(response.data) || !response.data.error) {
      if(response.data) {
        return ($q.reject(response.data));
      }
      if(response) {
        return ($q.reject(response));
      }
      return ($q.reject("An unknown error occurred."));
    }
    return ($q.reject(response.data.error));
  }

  function handleSuccess(response) {
    return (response.data);
  }
}]);
