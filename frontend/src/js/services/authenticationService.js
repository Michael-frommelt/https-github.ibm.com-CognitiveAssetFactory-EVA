/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('main').service('AuthenticationService', ['$http', '$q', '$window', 'PermPermissionStore', 'PermRoleStore', 'PERMISSIONS',
  function($http, $q, $window, PermPermissionStore, PermRoleStore, PERMISSIONS) {
    var userEndpoint = '/api/user/';
    var rolesEndpoint = '/api/role/';
    var service = this;
    var permissions = PERMISSIONS;
    
    // cache
    var roles = [];
    var rolesInitialized = false;

    this.login = function(username, password, client) {
      return $http.post(userEndpoint + 'login', {
        // standardized variable names that backend authentication via passport.js looks for
        username: username,
        password: password,
        // additional data
        client: client,
      }).then(function(response) {
        var userData = response.data;
        $window.sessionStorage.setItem('user', JSON.stringify({
          name: username,
          role: userData.role,
          permissions: userData.permissions,
          debugmode: userData.debugmode,
        }));
        return username;
      });
    };

    this.logout = function() {
      return $http.post(userEndpoint + 'logout').then(function(response) {
        if(response.status === 200 && response.data.logout === true) {
          return $q.resolve();
        }
        return $q.reject();
      }, function(error) {
        if(error.status === 401 || error.status === 403) {
          return $q.resolve();
        }
        return $q.reject(error);
      }).then(function() {
        service.clearUserData();
      });
    };

    this.getUserData = function() {
      return JSON.parse($window.sessionStorage.getItem('user'));
    };

    this.updateLocalRoleAndPermissions = function(newRoleId, newPermissions) {
      var userData = service.getUserData();
      if (newRoleId != null) userData.role = newRoleId;
      if (Array.isArray(newPermissions)) userData.permissions = newPermissions;
      $window.sessionStorage.setItem('user', JSON.stringify(userData));
    };

    this.clearUserData = function() {
      $window.sessionStorage.removeItem('user');
    };

    this.getPermissions = function() {
      return permissions;
    };

    this.getRoles = function(forceReload) {
      if (!forceReload && rolesInitialized) {
        return $q.resolve(roles);
      }
      return $http.get(rolesEndpoint).then(function(response) {
        roles.splice(0, roles.length);
        for (var i = 0; i < response.data.length; i++) {
          roles.push(response.data[i]);
        }
        rolesInitialized = true;
        return roles;
      });
    };

    this.saveRole = function(role) {
      if (!role.hasOwnProperty('id')) {
        return $q.reject('Invalid role format');
      }
      return $http.post(rolesEndpoint + role.id, role).then(function() {
        reloadRole(role);
        for (var i = 0; i < roles.length; i++) {
          if (roles[i].id === role.id) {
            roles[i] = role;
            return true;
          }
        }
        roles.push(role);
      });
    };

    this.deleteRole = function(roleId) {
      return $http.delete(rolesEndpoint + roleId).then(function() {
        PermRoleStore.removeRoleDefinition(roleId);
        for (var i = 0; i < roles.length; i++) {
          if (roles[i].id === roleId) {
            roles.splice(i, 1);
            return true;
          }
        }
      });
    };
    
    this.reloadPermissions = function() {
      PermPermissionStore.clearStore();
      
      PermPermissionStore.definePermission('isAuthenticated', ['AuthenticationService', function(AuthenticationService) {
        return AuthenticationService.getUserData() != null;
      }]);
      
      var permissions = service.getPermissions().concat('isAdmin');
      PermPermissionStore.defineManyPermissions(permissions, ['permissionName', 'AuthenticationService',
        function(permissionName, AuthenticationService) {
          var userData = AuthenticationService.getUserData();
          if (userData == null) {
            return false;
          }
          if (Array.isArray(userData.permissions) && userData.permissions.indexOf(permissionName) !== -1) {
            return true;
          }
          return AuthenticationService.getRoles().then(function(roles) {
            for (var i = 0; i < roles.length; i++) {
              if (roles[i].id == userData.role && Array.isArray(roles[i].permissions)
                && roles[i].permissions.indexOf(permissionName) !== -1) {
                return $q.resolve();
              }
            } 
            return $q.reject();
          });
        }
      ]);
    };

    this.reloadRoles = function() {
      service.getRoles(true).then(function(roles) {
        for (var i = 0; i < roles.length; i++) {
          reloadRole(roles[i]);
        }
      });
    };

    function reloadRole(role) {
      PermRoleStore.removeRoleDefinition(role.id);
      PermRoleStore.defineRole(role.id, ['roleName', 'AuthenticationService', function(roleId, AuthenticationService) {
        var userData = AuthenticationService.getUserData();
        if (userData != null && userData.role === roleId) {
          return true;
        }
        return false;
      }]);
    }
  }
]).run(['AuthenticationService', function(AuthenticationService) {
  AuthenticationService.reloadPermissions();
  AuthenticationService.reloadRoles();
}]);