(function () {
  'use strict';

  angular
    .module('app')
    .controller('HomeController', HomeController);

  HomeController.$inject = [
    '$scope', 'userService', 'configService'
  ];

  function HomeController($scope, userService, configService) {
    var vm = this;
    vm.user = null;
    vm.fbLogin = userService.login;
    vm.anonymousLogin = userService.anonymousLogin;
    configService.getParams().then(function (params) {
      vm.allowFacebookLogin = params.allowFacebookLogin;
    });

    _active();

    function _active() {

    }
    $scope.$on('user-logged-in', function () {
      userService.getProfile().then(function (user) {
        if (user) {
          vm.user = user;
        }
      });
    });
  }
})();
