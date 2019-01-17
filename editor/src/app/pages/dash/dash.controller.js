(function () {
  'use strict';

  angular
    .module('app')
    .controller('DashController', DashController);

  DashController.$inject = [
    '$rootScope',
    '$scope',
    'projectModel',
    'userService'
  ];

  function DashController($rootScope, $scope, projectModel, userService) {
    var vm = this;
    vm.project = null;
    vm.userProfile = null;
    vm.user = function () {
      return userService.user();
    }

    _activate();

    function _activate() {
      vm.project = projectModel.getProject();
    }
    $scope.$on('dash-projectchanged', function () {
      _activate();
    });
    $scope.$on('user-logged-in', function () {
      userService.getProfile().then(function (user) {
        if (user) {
          vm.userProfile = user;
        }
      });
    });
  }
})();
