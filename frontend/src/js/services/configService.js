/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('main').service('ConfigService', ['$http', '$q',
  function($http, $q) {
    // return public API.
    return ({
      getConfig: getConfig,
      updateConfig: updateConfig,
      reloadClients: reloadClients,
      getClientsForUser: getClientsForUser
    });

    function getConfig(id) {
      return $http.post('/api/config/get', {
        config_id: id
      }).then(handleSuccess, handleError);
    }

    function updateConfig(id, config_object) {
      return $http.post('/api/config/update', {
        config_id: id,
        config_object: config_object
      }).then(handleSuccess, handleError);
    }

    function reloadClients() {
      return $http.get('/api/clients/reload').then(handleSuccess, handleError);
    }

    function getClientsForUser(showHidden, showTechnical) {
        if(!showHidden) {
            showHidden = false;
        }

        if(!showTechnical) {
            showTechnical = false;
        }

        return $http.post('/api/user/getClientsForUser/' + showHidden.toString() + '/' + showTechnical.toString());
    }

    function handleSuccess(response) {
      return response.data;
    }

    function handleError(response) {
      if(response.status === 401) {
        return $q.reject('You\'re not logged in. Please reload and log in again.');
      }
      if (!angular.isObject(response.data) || !response.data.error) {
        if (response.data) {
          return $q.reject(response.data);
        }
        if (response) {
          return $q.reject(response);
        }
        return $q.reject("An unknown error occurred.");
      }
      return $q.reject(response.data.error);
    }
  }
]);
