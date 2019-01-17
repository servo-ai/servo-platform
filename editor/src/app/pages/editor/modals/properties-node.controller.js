(function() {
  'use strict';

  angular
    .module('app')
    .controller('PropertiesNodeController', PropertiesNodeController);

  PropertiesNodeController.$inject = [
    '$scope',
    '$timeout',
    '$window',
    '$state',
    '$stateParams',
    'dialogService',
    'notificationService'
  ];

  function PropertiesNodeController($scope,
                                $timeout,
                              $window,
                              $state,
                              $stateParams,
                              dialogService,
                              notificationService) {
    var vm = this;
    vm.action = 'New';
    vm.node = null;
    vm.blacklist = null;
    vm.original = null;
    vm.save = save;
    vm.cancel = cancel;
    vm.toggleView = toggleView;
    vm.options = {mode:'code',modes:true}

    _active();

    function _active() {
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();
      var s = t.blocks.getSelected();

      if (s.length === 1) {
        vm.original = s[0];
        vm.properties =JSON.parse(JSON.stringify(s[0].properties));
      } else {
        alert('strange error: no selected node')
      }

     
    }

    function save() {
      var node = vm.original; 
      node.properties = angular.copy(vm.properties);
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();
      t.blocks.update(vm.original, node);
     
      $state.go('editor');
      notificationService
        .success('Node updated', 'Node has been updated successfully.');
    }

    function cancel() {
          $state.go('editor');
    }

    function toggleView() {
      vm.options.mode =  vm.options.mode == 'tree' ? 'code' : 'tree';
      vm.properties = angular.copy(vm.properties);// force update
    }
  }

})();