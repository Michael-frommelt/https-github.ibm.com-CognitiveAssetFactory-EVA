/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.variableStore').service('VariableStoreService', ['$http', '$q', '$window','Upload',
  function($http, $q, $window,Upload) {
    var variablesEndpoint = '/api/variables';
    var dataUpdateInterval = 300000; //ms, default value

    // caches and cache timestamps
    var variables = [];
    var variablesTimestamps = 0;

    var that = this;

    this.saveVariable = function(variable, update) {
      if (!variable.hasOwnProperty('name')) {
        return $q.reject('Invalid answer property format');
      }
      var body = {};
      body.update = update;
      body.variable = variable;
      return $http.post(variablesEndpoint + '/' + variable.name, body).then(function() {
        for (var i = 0; i < variables.length; i++) {
          if (variables[i].name === variable.name) {
            variables[i] = variable;
            return true;
          }
        }
        variables.push(variable);
      });
    };

    this.deleteVariable = function(variableName) {
      return $http.delete(variablesEndpoint + '/' + variableName).then(function() {
        for (var i = 0; i < variables.length; i++) {
          if (variables[i].name === variableName) {
            variables.splice(i, 1);
            return true;
          }
        }
      });
    };

    this.getVariables = function(forceReload) {
      if (!forceReload && variablesTimestamps && (Date.now() - variablesTimestamps) <= dataUpdateInterval) {
        return $q.resolve(variables);
      } else {
        return $http.get(variablesEndpoint).then(function(getResult) {
          if (!variables) {
            variables = [];
          }
          variables.splice(0, variables.length);
          for (var i = 0; i < getResult.data.length; i++) {
            variables.push(getResult.data[i]);
          }
          variablesTimestamps = Date.now();
          return variables;
        });
      }
    };

    this.importVariables = function( file, override) {
      return Upload.upload({
        url: variablesEndpoint + '/import' ,
        params: { override: override },
        data: { uploadFile: file }
      });
    };

    this.exportVariables = function( language, fileType) {
      $window.open(variablesEndpoint + '/export'  + '?lang=' + language + '&type=' + fileType);
    };
  }
]);
