/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main')
// controller to switch clients
.controller('TrainingCtrl', ['$scope', '$http', 'conversationService', '$uibModal',
  function($scope, $http, conversationService, $uibModal) {
    $scope.dataFromTrainingTable = {};
    $scope.clientSelection = {};
    $scope.clientSelection.availableClients = [];
    $scope.isLoading = true;

    var rowClick = function(row) {
      var modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'views/admin/trainingModal.html',
        controller: 'TrainingModalCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        keyboard: false,
        backdrop: 'static',
        resolve: {
          feedbackRow: function () {
            return row;
          }
        }
      });

      modalInstance.result.then(function(success) {
        console.log(success);
        $scope.dataFromTrainingTable.refresh();
      }, function () {
        console.log('Modal dismissed at: ' + new Date());
        $scope.dataFromTrainingTable.refresh();
      });
    };

    $scope.tableDefinition = {
      maxEntriesPerPage: "25",
      autorefresh: "10",
      status: {
        column: "status",
        success: 2,
        warning: 1
      },
      clickEvents: {
        tr: rowClick
      },
      defaultSorting: {
        columnId: "created"
      },
      columnDefs: [{
        id: 'conversationId',
        name: 'Conversation ID',
        active: false,
        filter: 'text'
      }, {
        id: 'username',
        name: 'Username',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'question',
        name: 'Question',
        active: true
      }, {
        id: 'answer',
        name: 'Answer',
        active: true
      }, {
        id: 'longAnswerId',
        name: 'Long Answer ID',
        active: true
      }, {
        id: 'answerFrom',
        name: 'Answer From',
        active: false,
        filter: 'text'
      }, {
        id: 'feedback',
        name: 'Feedback',
        active: true,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'comment',
        name: 'User Comment',
        active: false
      }, {
        id: 'topIntent',
        name: 'Top Intent',
        active: true
      }, {
        id: 'topConfidence',
        name: 'Confidence',
        active: true,
        filter: 'percent',
        type: 'percent',
      }, {
        id: 'entityString',
        name: 'Entities',
        active: true
      }, {
        id: 'updated',
        name: 'Updated',
        active: false,
        type: 'date',
        filter: 'date'
      }, {
        id: 'created',
        name: 'Created',
        active: false,
        type: 'date',
        filter: 'date'
      }, {
        id: 'reason',
        name: 'Reason',
        active: false,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'answer_proposal',
        name: 'Answer Proposal',
        active: false
      }, {
        id: 'cluster',
        name: 'Cluster',
        active: false,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'topic',
        name: 'Topic',
        active: false,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'content',
        name: 'Content',
        active: false,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'priority',
        name: 'Priority',
        active: false,
        filter: 'select',
        filterAutoSelect: true
      }, {
        id: 'topIntent',
        name: 'Top Intent',
        active: true
      }, {
        id: 'topConfidence',
        name: 'Confidence',
        active: true,
        filter: 'percent',
        type: 'percent',
      }, {
        id: 'entityString',
        name: 'Entities',
        active: true
      }, {
        id: 'updated',
        name: 'Updated',
        active: false,
        type: 'date',
        filter: 'date'
      }, {
        id: 'created',
        name: 'Created',
        active: false,
        type: 'date',
        filter: 'date'
      }]
    };

    var getClients = function() {
      $scope.isLoading = true;
      $http({
        method: "POST",
        url: '/api/user/getClientsForUser/true/false'
      }).then(function(response) {
        var data = response.data;
        if(data.length > 0) {
          $scope.clientSelection.availableClients = data;
          $scope.isLoading = false;
        }
      }, function(response) {
        $scope.errorText = "Mandanten konnten nicht geladen werden.";
      });
    };

    getClients();

    $scope.setClient = function() {
      console.log($scope.clientSelection.chosen);
    };

    $scope.deleteClient = function() {
      $scope.clientSelection.chosen = "";
    }

    var getFeedback = function(filter, limit, page, sorting, callback) {
      if(!filter) filter = {};
      filter.clientId = {
        type: "exact",
        value: $scope.clientSelection.chosen
      };
      $scope.getFeedbackInAction = true;
      conversationService.getFeedback(filter, limit, page, sorting)
        .then(function(data) {
          return callback(data);
        }, function(data) {
          $scope.errorText = data;
        });
    };

    var countFeedback = function(filter, callback) {
      if(!filter) filter = {};
      filter.clientId = {
        type: "exact",
        value: $scope.clientSelection.chosen
      };
      $scope.getFeedbackInAction = true;
      conversationService.countFeedback(filter)
        .then(function(data) {
          callback(data);
        }, function(data) {
          $scope.errorText = data;
          callback(0);
        });
    };

    var distinctFeedback = function(columnDef, callback) {
      var columnId = columnDef.id;
      conversationService.distinctFeedback(columnId)
        .then(function(data) {
          callback(columnDef, data);
        }, function(data) {
          $scope.errorText = data;
          callback([]);
        });
    };

    $scope.contentQueries = {};
    $scope.contentQueries.getFeedback = getFeedback;
    $scope.contentQueries.countFeedback = countFeedback;
    $scope.contentQueries.getSelectFilterValues = distinctFeedback;
  }
]);
