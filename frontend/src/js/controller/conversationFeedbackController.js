/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.conversationFeedback').controller('ConversationFeedbackCtrl', ['$scope', '$interval', '$translate', '$uibModal', '$window', 'ConversationFeedbackService',
  function($scope, $interval, $translate, $uibModal, $window, ConversationFeedbackService) {
    $scope.dataFromReportingTable = {};
    $scope.exportProgress = null;
    var exportProgressInterval = null;

    $scope.tableDefinition = {
      maxEntriesPerPage: '25',
      defaultSorting: {
        columnId: 'created',
      },
      columnDefs: [{
        id: 'conversationId',
        name: $translate.instant('CONVERSATION_ID'),
        active: false,
        filter: 'text'
      }, {
        id: 'clientId',
        name: $translate.instant('CLIENT_ID'),
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'username',
        name: $translate.instant('USERNAME'),
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'comment',
        name: $translate.instant('COMMENT'),
        active: true
      }, {
        id: 'rating',
        name: $translate.instant('RATING'),
        active: true,
        filter: 'select',
        filterAutoSelect: true,
      }, {
        id: 'created',
        name: $translate.instant('CREATED'),
        active: true,
        type: 'date',
        filter: 'date',
      }],
      clickEvents: {
        tr: function(rowData) {
          $uibModal.open({
            templateUrl: 'additionalInfo.html',
            controller: ['$scope', function($scope) {
              $scope.feedback = rowData;
            }],
          }).result.catch(function() {});
        }
      },
    };

    $scope.generateConversationFeedbackExport = function(filter, sorting) {
      $scope.exportProgress = 0;
      ConversationFeedbackService.generateConversationFeedbackExport(filter, sorting).then(function() {
        getExportProgress(true);
      }, function() {
        $scope.exportProgress = null;
      });
    };

    $scope.cancelConversationFeedbackExport = function() {
      $interval.cancel(exportProgressInterval);
      ConversationFeedbackService.cancelConversationFeedbackExport().then(function() {
        $scope.exportProgress = null;
      });
    };

    $scope.downloadConversationFeedbackExport = function() {
      $window.open('/api/conversation-feedback/export/download');
    };

    function getExportProgress(downloadOnFirstCall) {
      ConversationFeedbackService.getConversationFeedbackExportProgress().then(function(progress) {
        if (progress === null) return;

        $scope.exportProgress = progress;

        if (progress === 100) {
          if (downloadOnFirstCall) $scope.downloadConversationFeedbackExport();
          return;
        }

        exportProgressInterval = $interval(function() {
          ConversationFeedbackService.getConversationFeedbackExportProgress().then(function(progress) {
            $scope.exportProgress = progress;
            if (progress === 100) {
              $interval.cancel(exportProgressInterval);
              $scope.downloadConversationFeedbackExport();
            }
          }, handleError);
        }, 2000);
      }, handleError);
    }
    getExportProgress(false);
    $scope.$on('$destroy', function() {
      $interval.cancel(exportProgressInterval);
    });

    $scope.contentQueries = {
      getFeedback: function(filter, limit, page, sorting, callback) {
        ConversationFeedbackService.getConversationFeedback(filter, limit, page, sorting).then(function(response) {
          callback(response.data);
        }, handleError);
      },
      countFeedback: function(filter, callback) {
        ConversationFeedbackService.countConversationFeedback(filter).then(function(response) {
          callback(response.data);
        }, function(error) {
          callback(0);
          handleError(error);
        });
      },
      getSelectFilterValues: function(columnDefinition, callback) {
        ConversationFeedbackService.getDistinctColumnValues(columnDefinition.id).then(function(response) {
          callback(columnDefinition, response.data);
        }, function(error) {
          callback([]);
          handleError(error);
        });
      },
    };

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);
