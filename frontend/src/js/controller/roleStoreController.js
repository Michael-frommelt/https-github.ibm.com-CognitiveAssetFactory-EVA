/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.roleStore').controller('RoleStoreCtrl', ['$scope', '$q', '$route', '$uibModal', 'AuthenticationService', 'UserManagementService',
  function($scope, $q, $route, $uibModal, AuthenticationService, UserManagementService) {
    $scope.availablePermissions = AuthenticationService.getPermissions();
    $scope.roles = [];
    $scope.error = null;

    // Scope Functions
    $scope.loadRoles = function(forceReload) {
      $scope.isLoading = true;
      AuthenticationService.getRoles(forceReload).then(function(roles) {
        $scope.roles = roles;
        $scope.isLoading = false;
      }, handleError);
    };
    $scope.loadRoles();

    $scope.checkForUsersWithRole = function(roleId) {
      return UserManagementService.getUsers(true).then(function(users) {
        return users.reduce(function(counter, user) {
          if (user.role === roleId) counter += 1;
          return counter;
        }, 0);
      });
    };

    $scope.buttonCleanUpUsers = function() {
      $scope.isCleaning = true;
      cleanUpDanglingRolesAndPermissions().catch(handleError).finally(function() {
        $scope.isCleaning = false;
      });
    };

    $scope.openDeleteModal = function(role) {
      $uibModal.open({
        templateUrl: 'deleteModal.html',
        scope: $scope,
        controller: ['$scope', 'AuthenticationService', function($scope, AuthenticationService) {
          $scope.isDeleting = false;
          $scope.roleName = role.name;
          $scope.checkForUsersWithRole(role.id).then(function(warningCount) {
            $scope.roleWarningCount = warningCount;
          });

          $scope.deleteRole = function() {
            $scope.isDeleting = true;
            AuthenticationService.deleteRole(role.id).catch(handleError).finally(function() {
              cleanUpDanglingRolesAndPermissions();
              $scope.isDeleting = false;
              $scope.$dismiss();
            });
          };
        }]
      }).result.catch(function() {});
    };

    $scope.openEditModal = function(isNew, role) {
      $uibModal.open({
        templateUrl: 'editModal.html',
        scope: $scope,
        size: 'lg',
        controller: ['$scope', 'AuthenticationService', function($scope, AuthenticationService) {
          $scope.isSaving = false;
          $scope.isNew = isNew;
          
          if(isNew) {
            $scope.role = {
              id: '',
              name: '',
              permissions: [],
            };
          } else {
            $scope.role = JSON.parse(JSON.stringify(role));
          }

          $scope.syncIdIfNew = function() {
            if (isNew) {
              $scope.role.id = $scope.role.name.toUpperCase();
            }
          };

          $scope.isValid = function() {
            var idUnique = true;
            if (isNew) {
              for (var i = 0; i < $scope.roles.length; i++) {
                if ($scope.role.id === $scope.roles[i].id) {
                  idUnique = false;
                  break;
                }
              }
            }
            return $scope.role.name.trim() !== '' && idUnique && $scope.role.permissions.length > 0;
          };

          $scope.togglePermissionSelection = function(permission) {
            var index = $scope.role.permissions.indexOf(permission);
            if (index > -1) {
              $scope.role.permissions.splice(index, 1);
            } else {
              $scope.role.permissions.push(permission);
            }
          };

          $scope.saveRole = function() {
            $scope.isSaving = true;
            AuthenticationService.saveRole($scope.role).catch(handleError).finally(function() {
              $scope.isSaving = false;
              $scope.$dismiss();
              // reload route, because it is possible that we modified our own permissions
              $route.reload();
            });
          };
        }]
      }).result.catch(function() {});
    };

    function cleanUpDanglingRolesAndPermissions() {
      return $q.all([
        UserManagementService.getUsers(true),
        AuthenticationService.getRoles(true),
      ]).then(function(resultArray) {
        var users = resultArray[0];
        var roles = resultArray[1];
        var permissions = AuthenticationService.getPermissions();
        var promiseArray = [];
        roles.forEach(function(role) {
          if(role.permissions) {
            var filteredPermissions = role.permissions.filter(function(permission) {
              return permissions.indexOf(permission !== -1);
            });

            if (filteredPermissions.length < role.permissions.length) {
              role.permissions = filteredPermissions;
              promiseArray.push(AuthenticationService.saveRole(role));
            }
          }
        });

        users.forEach(function(user) {
          var userModified = false;
          var roleIds = roles.map(function(role) {
            return role.id;
          });
          
          if (typeof user.role === 'string' && user.role !== '' && roleIds.indexOf(user.role) === -1) {
            user.role = '';
            userModified = true;
          }

          if (Array.isArray(user.permissions)) {
            var filteredPermissions = user.permissions.filter(function(permission) {
              return permissions.indexOf(permission) !== -1;
            });
            
            if (filteredPermissions.length < user.permissions.length) {
              user.permissions = filteredPermissions;
              userModified = true;
            }
          }

          if (userModified) {
            promiseArray.push(UserManagementService.saveUser(user, null, false));
          }
        });
        return $q.all(promiseArray).then(function(resultArray) {
          // reload route, because it is possible that we modified our own permissions
          $route.reload();
          return resultArray;
        });
      });
    }

    function handleError(error) {
      console.log(error);
      $scope.error = error;
    }
  }
]);
