/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/
  
angular.module('eva.answerStore').controller('AnswerStoreDetailCtrl', ['$scope', '$http', '$location', '$q', '$routeParams', '$uibModal', '$window', 'AnswerStoreService', 'ConfigService',
  function($scope, $http, $location, $q, $routeParams, $uibModal, $window, AnswerStoreService, ConfigService) {
    $scope.isNewAnswer = false; 
    $scope.isSaving = false;
    $scope.isRestoringVersion = false;
    
    if ($routeParams.answerOptionIndex) {
      $scope.showAnswerOptionView = true;
      $scope.displayMode = 'answerOption';
    } else {
      $scope.displayMode = 'answer';
    }

    $scope.answer = {};
    $scope.answerOption = {};
    $scope.answerProperties = [];
    $scope.answerVersions = [];
    $scope.oldAnswerText = '';
    $scope.recAnswerTextSize = 250;

    $q.all([loadAnswer(),
      AnswerStoreService.getAnswerProperties().then(function(answerProperties) {
        $scope.answerProperties = answerProperties;
      })
    ]).then(function() {
      for(var i = 0; i < $scope.answerProperties.length; i++) {
        var property = $scope.answerProperties[i];
        if (!$scope.answerOption.properties.hasOwnProperty(property.name) && property.required) {
          if (property.type === 'number') {
            $scope.answerOption.properties[property.name] = 0;
          } else if (property.type === 'multipleChoice') {
            $scope.answerOption.properties[property.name] = property.choices[0];
          }
        }
      }
    }, handleError);

    ConfigService.getConfig('answerStore').then(function(config) {
      if (config.frontend.answerfileSizeLimit) {
        $scope.recAnswerTextSize = config.frontend.answerTextSize;
      }
      $scope.showWYSIWYGEditor = config.frontend.showWYSIWYGEditor || false;
    });

    if (!$scope.isNewAnswer) {
      $scope.isLoadingVersions = true;
      AnswerStoreService.getVersions($routeParams.answerSetId, $routeParams.answerId).then(function(answerVersions) {
        $scope.answerVersions = answerVersions;
      }, function(error) {
        if (error.status === 404) return $q.resolve();
        return $q.reject(error);
      }).catch(handleError).then(function() {
        $scope.isLoadingVersions = false;
      });
    }

    $scope.WYSIWYGeditor = null;
    $scope.WYSIWYGoptions = {
      minHeight: 100,
      maxHeight: 400,
      focus: true,
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
        ['font', ['fontsize', 'color']],
        ['insert', ['link', 'table', 'hr']],
        ['style', ['ol', 'ul', 'paragraph', 'style', 'height', 'lineheight']],
        ['toggle', ['codeview',]],
      ],
      dialogsInBody: true,
      dialogsFade: true,
      disableDragAndDrop: true,
    };

    $scope.getSelectedVersion = function() {
      for (var i = 0; i < $scope.answerVersions.length; i++) {
        if ($scope.answerVersions[i].isSelected) {
          return $scope.answerVersions[i];
        }
      }
      return null;
    };

    $scope.restoreVersion = function() {
      var versionDocument = $scope.getSelectedVersion();
      if (versionDocument !== null) {
        $scope.isRestoringAnswer = true;
        AnswerStoreService.saveAnswer($routeParams.answerSetId, versionDocument.answer).then(function() {
          $window.location.reload();
        }, handleError).then(function() {
          $scope.isRecoveringAnswer = false;
        });
      }
    };

    $scope.previewVersion = function() {
      var versionDocument = $scope.getSelectedVersion();
      var currentVersion = $scope.answer;
      $uibModal.open({
        templateUrl: 'previewModal.html',
        size: 'lg',
        controller: ['$scope', function($scope) {
          $scope.isPropertiesEmpty = function(properties) {
            return !(Object.keys(properties).length > 0);
          };

          $scope.versionDoc = versionDocument;
          $scope.relevantVersions = [versionDocument.answer, currentVersion];
        }]
      }).result.catch(function() {});
    };

    $scope.saveAnswer = function() {
      $scope.isSaving = true;
      var answerToSave = $scope.answer;
      var checkExisting = null;

      if ($scope.isNewAnswer) {
        answerToSave.answerOptions.push($scope.answerOption);
        checkExisting = AnswerStoreService.getAnswer($routeParams.answerSetId, answerToSave.answerId, true).then(function() {
          return $q.reject({status: 400, 'data.message': 'An Answer with this ID already exists.'});
        }, function(error) {
          if (error.status === 404) return $q.resolve();
          return $q.reject(error);
        });
      } else {
        var answerOptionIndex = parseInt($routeParams.answerOptionIndex, 10);
        if (!isNaN(answerOptionIndex)) {
          if (answerOptionIndex >= 0 && answerOptionIndex < answerToSave.answerOptions.length) {
            answerToSave.answerOptions[answerOptionIndex] = $scope.answerOption;
          } else {
            answerToSave.answerOptions.push($scope.answerOption);
          }
        }
        checkExisting = $q.resolve();
      }
      
      checkExisting.then(function() {
        AnswerStoreService.saveAnswer($routeParams.answerSetId, answerToSave).then(function() {
          $scope.cancel();
        }, handleError).finally(function() {
          $scope.isSaving = false;
        });
      }, handleError);
    };

    $scope.cancel = function() {
      $location.path('/admin/answerStore');
    };

    $scope.editorInvalid = function() {
      if ($scope.WYSIWYGeditor !== null) {
        console.log($scope.WYSIWYGeditor);
        return $scope.WYSIWYGeditor.isEmpty();
      }
      return false;
    };

    $scope.formsInvalid = function() {
      return ($scope.textForm.$invalid && $scope.editorInvalid()) || $scope.propertiesForm.$invalid
        || $scope.additionalAnswerProposalsForm.$invalid || $scope.generalAnswerProposalsForm.$invalid;
    };

    function loadAnswer() {
      if ($routeParams.answerId === '_new_') {
        $scope.isNewAnswer = true;
        $scope.answer = {
          answerId: '',
          answerOptions: [],
          answerProposals: [],
          tags: [],
        };
        $scope.answerOption = createAnswerOption();
        return $q.resolve();
      }

      $scope.isNewAnswer = false;
      return AnswerStoreService.getAnswer($routeParams.answerSetId, $routeParams.answerId).then(function(answer) {
        $scope.answer = answer;
        if (!$routeParams.answerOptionIndex) {
          $scope.answerOption = answer.answerOptions[0];
        } else if ($routeParams.answerOptionIndex >= 0 && $routeParams.answerOptionIndex < answer.answerOptions.length) {
          $scope.answerOption = answer.answerOptions[$routeParams.answerOptionIndex];
          $scope.oldAnswerText = $scope.answerOption.answerText;
        } else {
          $scope.answerOption = createAnswerOption();
        }
      });
    }

    function createAnswerOption() {
      return {
        properties: {},
        answerText: '',
        additionalAnswerProposals: [],
        tags: [],
      };
    }

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);