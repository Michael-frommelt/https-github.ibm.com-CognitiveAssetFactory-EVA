/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('eva.userManagement')
  .controller('UserCtrl', ['$scope', '$http', '$window', '$location', '$translate', 'UserManagementService', 'AuthenticationService', 'ConfigService', '$uibModal',
    function($scope, $http, $window, $location, $translate, UserManagementService, AuthenticationService, ConfigService, $uibModal) {

      $scope.failed_register = "";
      $scope.register_successful = false;
      $scope.clients = [];
      $scope.checkedClients = [];
      $scope.users = [];
      $scope.error = null;
      $scope.failed_change = "";
      $scope.isLoading = true;

      $scope.getClients = function() {

        $http({
          method: "POST",
          url: '/api/user/getClients/true/true'
        }).then(function(response) {
          $scope.clients = response.data;
          $scope.loadUsers(true);
          if ($scope.clients.length > 0) {
            $scope.client = $scope.clients[0].id;
          }
        }, function(error) {
          $scope.$parent.failed_login = $translate.instant('CLIENTS_ERROR');
        });
      };
      $scope.getClients();

      // Loading animation
      $scope.$watch('isLoading', function() {
          if($scope.isLoading == true) {
            blur = document.getElementsByClassName("blur_hide");
            blur.className = "ng-show";
            // hide display
          } else {
            blur = document.getElementById("blur_hide");
            blur.style.opacity = 0;
            blur.style.visibility = "hidden";
          }
      });

      $scope.loadUsers = function(forceReload) {

        $scope.isLoading = true;

        UserManagementService.getUsers(forceReload).then(function(users) {

          for (i in users) {
            users[i].clients_fullName = [];
            for (j in users[i].clients) {

              for (h in $scope.clients) {
                if ($scope.clients[h].id == users[i].clients[j]) users[i].clients_fullName.push($scope.clients[h].name);
              }
            }
          }
          for (k in users) {
            users[k].debugmode_translated = "";
            if (users[k].debugmode == true) {
              users[k].debugmode_translated = $translate.instant('YES');
            } else {
              users[k].debugmode_translated = $translate.instant('NO');
            }
          }
          $scope.users = users;
          $scope.isLoading = false;
        }, handleError);
      };

      AuthenticationService.getRoles().then(function(roles) {
        $scope.availableRoles = roles;
      });
      $scope.availablePermissions = AuthenticationService.getPermissions();


      $scope.openRegisterModal = function() {

        $uibModal.open({
          templateUrl: 'registerModal.html',
          scope: $scope,
          size: 'lg',
          controller: ['$scope', function($scope) {
            $scope.isSaving = false;
            $scope.user = {
              role: '',
              permissions: [],
            };
            $scope.$parent.failed_register = "";

            $scope.checkboxReadonlies = {};
            $scope.setCheckboxes = function() {
              var role = getRoleById($scope.user.role);
              $scope.checkboxReadonlies = {};
              $scope.userPermissions = [];
              if (role !== null) {
                $scope.userPermissions = angular.copy(role.permissions);
                for (var i = 0; i < role.permissions.length; i++) {
                  $scope.checkboxReadonlies[role.permissions[i]] = true;
                }
              }
            };
            $scope.setCheckboxes();

            $scope.togglePermissionSelection = function(permission) {
              var index = $scope.userPermissions.indexOf(permission);
              if (index > -1) {
                $scope.userPermissions.splice(index, 1);
              } else {
                $scope.userPermissions.push(permission);
              }
            };

            $scope.deleteError = function() {
              $scope.errorText = undefined;
            }
            $scope.registerUser = function() {

              var clientsForUser = [];
              for (var index in $scope.checkedClients) {
                if ($scope.checkedClients[index] === true) {
                  clientsForUser.push(index);
                }
              }

              var user = {
                "username": $scope.username,
                "password": $scope.password,
                "check_password": $scope.check_password,
                "clients": clientsForUser,
                "debugmode": $scope.debugmode,
                "role": $scope.user.role,
                "permissions": filterRolePermissions($scope.userPermissions, $scope.user.role),
              };

              if ($scope.username == undefined || $scope.password == undefined || $scope.check_password == undefined || clientsForUser.length == 0) {
                $scope.$parent.failed_register = $translate.instant('MISSING_FIELD');
              } else
                //check to see if the two passwords are the same
                if ($scope.password != $scope.check_password) {
                  $scope.$parent.failed_register = $translate.instant('WRONG_PASSWORD');
                  var error = true;
                } else {
                  var error = false;
                  $scope.errorText = undefined;
                  $scope.isSaving = true;

                  if (!error) {
                    var promise;

                    promise = UserManagementService.registerUser(user).catch(handleError);
                    promise.catch(handleError).finally(function() {
                      $scope.isSaving = false;
                      $scope.loadUsers(true);
                      $scope.$dismiss();
                    });
                  } else {
                    $scope.isSaving = false;

                  }
                }
            };
          }]
        }).result.catch(function() {});
      };

      $scope.openDeleteModal = function(userName) {
        $uibModal.open({
          templateUrl: 'deleteModal.html',
          scope: $scope,
          controller: ['$scope', function($scope) {
            $scope.isDeleting = false;
            $scope.userToDelete = userName;
            $scope.deleteUser = function() {
              $scope.isDeleting = true;
              var promise;
              promise = UserManagementService.deleteUser(userName).catch(handleError);
              promise.catch(handleError).finally(function() {
                $scope.isDeleting = false;
                $scope.loadUsers(true);
                $scope.$dismiss();
              });
            };
          }]
        }).result.catch(function() {});
      };

      $scope.openEditModal = function(user) {
        console.log($scope.clients);
        $scope.clientsForUser = JSON.parse(JSON.stringify($scope.clients));

        for (x in user.clients) {

          var not_exist = true;

          for (y in $scope.clientsForUser) {
            if ($scope.clientsForUser[y].id == user.clients[x]) {
              not_exist = false;
            }
          }
          if (not_exist) {
              var client_rem_only = {
                  notice: "REMOVE_ONLY",
                  name: user.clients[x]
              };
              $scope.clientsForUser.push(client_rem_only);
          }
        }

        for (i in $scope.clientsForUser) {
          if (user.clients.indexOf($scope.clientsForUser[i].id) != -1) {
            $scope.clientsForUser[i].checked = true;
          } else {
            $scope.clientsForUser[i].checked = false;
          }
        }

        $uibModal.open({
          templateUrl: 'editModal.html',
          scope: $scope,
          size: 'lg',
          controller: ['$scope', '$route', 'AuthenticationService', function($scope, $route, AuthenticationService) {
            $scope.isSaving = false;
            var passchange = false;
            $scope.user = JSON.parse(JSON.stringify(user));

            $scope.checkboxReadonlies = {};
            $scope.setCheckboxes = function() {
              var role = getRoleById($scope.user.role);
              $scope.checkboxReadonlies = {};
              $scope.userPermissions = [];
              if (role !== null) {
                $scope.userPermissions = angular.copy(role.permissions);
                for (var i = 0; i < role.permissions.length; i++) {
                  $scope.checkboxReadonlies[role.permissions[i]] = true;
                }
              }
            };
            $scope.setCheckboxes();
            $scope.userPermissions = $scope.userPermissions.concat($scope.user.permissions);

            $scope.togglePermissionSelection = function(permission) {
              var index = $scope.userPermissions.indexOf(permission);
              if (index > -1) {
                $scope.userPermissions.splice(index, 1);
              } else {
                $scope.userPermissions.push(permission);
              }
            };

            $scope.deleteError = function() {
              $scope.errorText = undefined;
            }
            $scope.saveUser = function() {

              var newClients = [];

              for (index in $scope.clientsForUser) {
                if ($scope.clientsForUser[index].checked === true) {
                  newClients.push($scope.clientsForUser[index].id);
                }
              }

              var user = {
                "username": $scope.user.username,
                "password": $scope.user.password,
                "clients": newClients,
                "debugmode": $scope.user.debugmode,
                "role": $scope.user.role,
                "permissions": filterRolePermissions($scope.userPermissions, $scope.user.role),
              };

              var error = false;
              $scope.errorText = undefined;
              $scope.isSaving = true;

              if (!error) {
                UserManagementService.saveUser(user, $scope.editUser, passchange).then(function() {
                  if (user.username === AuthenticationService.getUserData().name) {
                    AuthenticationService.updateLocalRoleAndPermissions(user.role, user.permissions);
                    $route.reload();
                  }
                }, handleError).finally(function() {
                  $scope.isSaving = false;
                  $scope.loadUsers(true);
                  $scope.$dismiss();
                });
              } else {
                $scope.isSaving = false;
              }
            };
          }]
        }).result.catch(function() {});
      };

      $scope.openPasswordModal = function(user) {

        $uibModal.open({
          templateUrl: 'passwordModal.html',
          scope: $scope,
          controller: ['$scope', function($scope) {
            $scope.isSaving = false;
            $scope.$parent.failed_change = "";

            $scope.user = JSON.parse(JSON.stringify(user));

            $scope.deleteError = function() {
              $scope.errorText = undefined;
            }
            $scope.saveUser = function() {

              var passchange = true;
              var user = {
                "username": $scope.user.username,
                "password": $scope.password,
                "check_password": $scope.check_password,
                "clients": $scope.user.clients,
                "debugmode": $scope.user.debugmode,
                "role": $scope.user.role,
                "permissions": $scope.user.permissions,
              };

              if ($scope.password == undefined || $scope.check_password == undefined) {
                $scope.$parent.failed_change = $translate.instant('MISSING_FIELD');
              } else
                //check to see if the two passwords are the same
                if ($scope.password != $scope.check_password) {
                  $scope.$parent.failed_change = $translate.instant('WRONG_PASSWORD');
                  var error = true;
                } else {
                  var error = false;
                  $scope.errorText = undefined;
                  $scope.isSaving = true;

                  if (!error) {
                    var promise;

                    promise = UserManagementService.saveUser(user, $scope.editUser, passchange).catch(handleError);
                    promise.catch(handleError).finally(function() {
                      $scope.isSaving = false;
                      $scope.loadUsers(true);
                      $scope.$dismiss();
                    });
                  } else {
                    $scope.isSaving = false;

                  }
                }
            };
          }]
        }).result.catch(function() {});
      };

      $scope.changeUserPassword = function() {
        if ($scope.password == undefined || $scope.check_password == undefined) {
          $scope.failed_change = $translate.instant('MISSING_FIELD');
        } else if ($scope.password != $scope.check_password) {
          $scope.failed_change = $translate.instant('WRONG_PASSWORD');
        } else {
          $scope.isSaving = true;
          ConfigService.getClientsForUser(true, true).then(function(response) {
            var userClients = [];
            for (var j = 0; j < response.data.length; j++) {
              userClients.push(response.data[j].id);
            }
            var userData = AuthenticationService.getUserData();
            for (var i = 0; i < userData.permissions.length; i++) {
              if (userData.permissions[i] === 'isAdmin') {
                userData.permissions.splice(i, 1);
                i--;
              }
            }

            var user = {
              username: userData.name,
              password: $scope.password,
              clients: userClients,
              debugmode: userData.debugmode,
              role: userData.role,
              permissions: userData.permissions,
            };
            UserManagementService.saveUser(user, null, true).catch(handleError).finally(function() {
              $scope.isSaving = false;
            });
          });
        }
      };

      function getRoleById(roleId) {
        for (var i = 0; i < $scope.availableRoles.length; i++) {
          if ($scope.availableRoles[i].id === roleId) {
            return $scope.availableRoles[i];
          }
        }
        return null;
      }

      function filterRolePermissions(allPermissions, roleId) {
        var role = getRoleById(roleId);
        if (role !== null) {
          for (var i = 0; i < allPermissions.length; i++) {
            if (role.permissions.indexOf(allPermissions[i]) !== -1) {
              allPermissions.splice(i, 1);
              i--;
            }
          }
        }
        return allPermissions;
      }

      function handleError(error) {
        console.log(error);
        $scope.error = error;
      }
    }
  ]);
