(function () {
  'use strict';
  PropertiespanelController.$inject = [
    'notificationService',
    '$scope',
    '$window'
  ];

  function PropertiespanelController(notificationService, $scope,
    $window) {
    var vm = this;
    vm.original = null;
    vm.block = null;
    vm.update = update;
    vm.keydown = keydown;

    _create();
    _activate();

    $scope.$on('$destroy', _destroy);

    function _activate() {
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();
      var s = t.blocks.getSelected();

      if (s.length === 1) {
        vm.original = s[0];
        vm.block = {
          title: vm.original.title,
          description: vm.original.description,
          properties: tine.merge({}, vm.original.properties)
        };
      } else {
        vm.original = false;
        vm.block = false;
      }
    }

    function _event(e) {
      setTimeout(function () {
        $scope.$apply(function () {
          _activate();
        });
      }, 0);
    }

    function _create() {
      $window.editor.on('blockselected', _event);
      $window.editor.on('blockdeselected', _event);
      $window.editor.on('blockremoved', _event);
      $window.editor.on('treeselected', _event);
      $window.editor.on('blockchanged', _event);
    }

    function _destroy() {
      $window.editor.off('blockselected', _event);
      $window.editor.off('blockdeselected', _event);
      $window.editor.off('blockremoved', _event);
      $window.editor.off('treeselected', _event);
      $window.editor.off('blockchanged', _event);
    }

    function keydown(e) {
      if (e.ctrlKey && e.keyCode === 90) {
        e.preventDefault();
      }


      return false;
    }

    function update() {
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();

      // some validity checks
      if (vm.original.node.category === "root") {
        if (vm.original.title === p._id) {
          var oldNode = p.nodes.get(t._id);
          if (oldNode.name != vm.block.title) {
            vm.original.title = vm.block.title = oldNode.name;
            notificationService.error(
              'No root rename',
              'root name must remain equal to project'
            );
          }

          return;
        }

        var isValid = $window.editor.project.testTreeName(vm.block.title);
        var oldNode = p.nodes.get(t._id);
        if (!isValid) {
          vm.original.title = vm.block.title = oldNode.name;
          notificationService.error(
            'Invalid tree name',
            'Must contain only file name compatible letters'
          );
          return;
        }

        //Check for duplicated root node names
        if (oldNode.name != vm.block.title) {
          if (p.nodes.get(vm.block.title)) {
            vm.original.title = vm.block.title = oldNode.name;
            notificationService.error(
              'Invalid name',
              'You must provide a unique name for a root node.'
            );
            return;
          }

          p.nodes.remove(oldNode.name);
          oldNode.name = vm.block.title;
          p.nodes.add(oldNode);
          t._id = vm.block.title;
        }
      }

      t.blocks.update(vm.original, vm.block);
    }
  }

  angular
    .module('app')
    .directive('b3PropertiesPanel', function () {
      return {
        scope: true,
        controller: PropertiespanelController,
        templateUrl: 'directives/properties-panel.html',
        restrict: 'EA',
        replace: false,
        bindToController: true,
        controllerAs: 'propertiespanel'
      };
    });


})();
