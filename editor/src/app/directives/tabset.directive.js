(function () {
  'use strict';

  angular
    .module('app')
    .directive('b3Tabset', tabset);

  function tabset() {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      scope: {
        activeTab: '=',
        onClick: '=?'
      },
      templateUrl: 'directives/tabset.html',
      bindToController: true,
      controllerAs: 'tabset',
      controller: tabsetController,
    };
    return directive;
  }

  tabsetController.$inject = ['$scope'];
  function tabsetController($scope) {
    // HEAD //
    /* jshint validthis: true */
    var vm = this;
    vm.tabs = [];
    vm.add = add;
    vm.select = select;
    $scope.$watch('tabset.activeTab', function (n, o) {

      angular.forEach(vm.tabs, function (t) {

        t.active = t.heading === n;

      });

    });

    // BODY //
    function add(tab) {
      vm.tabs.push(tab);
    }

    function select(tab) {

      vm.onClick && vm.onClick(tab.heading);
      vm.activeTab = tab.heading;

      angular.forEach(vm.tabs, function (t) {
        if (t.active && t !== tab) {
          t.active = false;
        }


      });

      tab.active = true;
    }


  }


})();