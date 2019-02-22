/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('main').controller('SettingsCtrl', ['$scope', '$q', '$uibModal', 'AnswerStoreService', 'ConfigService', 'SyncService',
  function($scope, $q, $uibModal, AnswerStoreService, ConfigService, SyncService) {
    $scope.isRecoveringAnswer = false;
    $scope.isSaving = false;
    $scope.isSyncingAnswerIds = false;
    $scope.isSyncingVariables = false;

    $scope.answerStoreConfig = null;
    $scope.answerProperties = [];
    $scope.availableAnswerSets = [];
    $scope.syncAnswerSet = null;
    $scope.versioningAnswerSet = null;
    $scope.deletedAnswers = [];

    AnswerStoreService.getAnswerSets().then(function(answerSets) {
      $scope.availableAnswerSets = answerSets;
      $scope.versioningAnswerSet = answerSets[0].id;
      $scope.syncAnswerSet = answerSets[0].id;
    }).then(function() {
      $scope.onVersioningAnswerSetChange();
    }, handleError);
    
    $scope.onVersioningAnswerSetChange = function() {
      AnswerStoreService.getVersionsMarkedForDeletion($scope.versioningAnswerSet).then(function(versionsForDeletedAnswers) {
        $scope.deletedAnswers = versionsForDeletedAnswers.map(function(versions) {
          return versions[0].answer;
        });
      }, handleError);
    };

    $scope.loadSettings = function() {
      ConfigService.getConfig('answerStore').then(function(answerStoreConfig) {
        $scope.answerStoreConfig = answerStoreConfig;
      }, handleError);
      AnswerStoreService.getAnswerProperties().then(function(answerProperties) {
        $scope.answerProperties = angular.copy(answerProperties);
      }, handleError);
    };
    $scope.loadSettings();

    $scope.saveSettings = function() {
      $scope.isSaving = true;
      var configPromise = ConfigService.updateConfig('answerStore', $scope.answerStoreConfig);
      var answerStorePromise = AnswerStoreService.getAnswerProperties().then(function(currentAnswerProperties) {
        newPropertiesLoop:
        for (var i = 0; i < $scope.answerProperties.length; i++) {
          var newAnswerProperty = $scope.answerProperties[i];
          for (var j = 0; j < currentAnswerProperties.length; j++) {
            if (angular.equals(newAnswerProperty, currentAnswerProperties[i])) {
              continue newPropertiesLoop;
            }
          }
          
          var propertyToSave = {
            name: newAnswerProperty.name,
            displayName: newAnswerProperty.displayName,
            required: newAnswerProperty.required,
            type: newAnswerProperty.type
          };
          if (newAnswerProperty.type === 'number') {
            propertyToSave.minValue = newAnswerProperty.minValue;
            propertyToSave.maxValue = newAnswerProperty.maxValue;
          } else if (newAnswerProperty.type === 'multipleChoice') {
            propertyToSave.choices = newAnswerProperty.choices;
          }
          AnswerStoreService.saveAnswerProperty(propertyToSave);
        }
      });

      $q.all([configPromise, answerStorePromise]).catch(handleError).finally(function() {
        $scope.isSaving = false;
      });
    };

    $scope.getSelectedDeletedAnswer = function() {
      for (var i = 0; i < $scope.deletedAnswers.length; i++) {
        if ($scope.deletedAnswers[i].isSelected) {
          return $scope.deletedAnswers[i];
        }
      }
      return null;
    };

    $scope.recoverDeletedAnswer = function() {
      var answer = $scope.getSelectedDeletedAnswer();
      delete answer.isSelected;
      if (answer) {
        $scope.isRecoveringAnswer = true;
        $q.all([
          AnswerStoreService.saveAnswer($scope.versioningAnswerSet, answer),
          AnswerStoreService.unmarkVersionForDeletion($scope.versioningAnswerSet, answer.answerId)
        ]).then(function() {
          for (var i = 0; i < $scope.deletedAnswers.length; i++) {
            if ($scope.deletedAnswers[i].answerId == answer.answerId) {
              $scope.deletedAnswers.splice(i, 1);
            }
          }
        }, handleError).then(function() {
          $scope.isRecoveringAnswer = false;
        });
      }
    };

    $scope.newAnswerProperty = function() {
      $scope.answerProperties.push({
        name: '',
        displayName: '',
        required: false,
        type: 'number',
        isNew: true
      });
    };

    $scope.openDeleteModal = function(answerPropertyName) {
      $uibModal.open({
        templateUrl: 'deleteModal.html',
        scope: $scope,
        controller: ['$scope', function($scope) {
          $scope.isDeleting = false;
          
          $scope.deleteAnswerProperty = function() {
            $scope.isDeleting = true;
            AnswerStoreService.deleteAnswerProperty(answerPropertyName).catch(handleError).finally(function() {
              $scope.isDeleting = false;
              for (var i = 0; i < $scope.answerProperties.length; i++) {
                if($scope.answerProperties[i].name === answerPropertyName) {
                  $scope.answerProperties.splice(i, 1);
                  break;
                }
              }
              $scope.$dismiss();
            });
          };
        }]
      }).result.catch(function() {});
    };

    $scope.formsInvalid = function() {
      return $scope.ASform.$invalid || $scope.answerPropertiesForm.$invalid;
    };

    $scope.computeAnswerIdDifference = function() {
      $scope.isSyncingAnswerIds = true;
      SyncService.getAnswerIdDifference($scope.syncAnswerSet).then(function(syncObject) {
        $scope.isSyncingAnswerIds = false;
        openSyncModal('answerIds', syncObject);
      }, handleError);
    };

    $scope.computeVariablesDifference = function() {
      $scope.isSyncingVariables = true;
      SyncService.getVariablesDifference($scope.syncAnswerSet).then(function(syncObject) {
        $scope.isSyncingVariables = false;
        openSyncModal('variables', syncObject);
      }, handleError);
    };

    function openSyncModal(mode, syncObject) {
      $uibModal.open({
        templateUrl: 'syncModal.html',
        scope: $scope,
        size: 'lg',
        controller: ['$scope', function($scope) {
          $scope.mode = mode;
          
          if (mode === 'answerIds') {
            $scope.wcsAnswerIds = syncObject.idsOnlyInWCS;
            $scope.ASanswerIds = syncObject.idsOnlyInAnswerStore;
          } else if (mode === 'variables') {
            $scope.variableStoreVariables = syncObject.variablesOnlyInVariableApi;
            $scope.ASvariables = syncObject.variablesOnlyInAnswerStore;
          }
        }]
      }).result.catch(function() {});
    }

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);