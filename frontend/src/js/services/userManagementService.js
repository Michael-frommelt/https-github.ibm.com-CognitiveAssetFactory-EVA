/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.userManagement').service('UserManagementService', ['$http', '$q', '$window',
  function($http, $q, $window) {

    var usersEndpoint = '/api/user';
    var dataUpdateInterval = 300000; //ms, default value

    // caches and cache timestamps
    var users = [];
    var usersTimestamps = 0;

    this.getUsers = function(forceReload) {

      if (!forceReload && usersTimestamps && (Date.now() - usersTimestamps) <= dataUpdateInterval) {
        return $q.resolve(users);
      } else {
        return $http.get(usersEndpoint + '/list').then(function(getResult) {
          if (!users) {
            users = [];
          }
          users.splice(0, users.length);
          for (var i = 0; i < getResult.data.length; i++) {
            users.push(getResult.data[i]);
          }
          usersTimestamps = Date.now();
          return users;
        });
      }
    };


    this.deleteUser = function(userName) {

      var body = {};
      body.username = userName;

      return $http.post(usersEndpoint + '/delete', body).then(function(result) {
        for (var i = 0; i < users.length; i++) {
          if (users[i].username === userName) {
            users.splice(i, 1);
            return true;
          }
        }
      });
    };

    this.registerUser = function(user) {

      if (!user.hasOwnProperty('username')) {
        return $q.reject('Invalid answer property format');
      }
      var body = {};
      body.user = user;

      return $http.post(usersEndpoint + '/register', body).then(function(result) {
        for (var i = 0; i < users.length; i++) {
          if (users[i].username === user.username) {
            users[i] = user;
            return true;
          }
        }
        users.push(user);
      });
    };

    this.saveUser = function(user, update, passchange) {

      if (!user.hasOwnProperty('username')) {
        return $q.reject('Invalid answer property format');
      }
      var body = {};
      body.update = update;
      body.user = user;
      body.passchange = passchange;

      return $http.post(usersEndpoint + '/update', body).then(function(result) {
        for (var i = 0; i < users.length; i++) {
          if (users[i].username === user.username) {
            users[i] = user;
            return true;

          }
        }
        users.push(user);
      });
    };

  }
]);
