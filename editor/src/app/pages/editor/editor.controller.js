angular
  .module('app')
  .controller('EditorController', EditorController);

EditorController.$inject = ['$scope', '$window', 'settingsModel', 'debugCommService'];


function EditorController($scope, $window, settingsModel, debugCommService) {

  var vm = this;



  vm.settings = {};
  vm.settings.leftSelectedTab = vm.settings.leftSelectedTab || "Nodes";
  vm.settings.rightSelectedTab = vm.settings.rightSelectedTab || "Properties";


  settingsModel.getSettings().then(function (settings) {

    settings.editor = settings.editor || {};
    vm.settings = settings.editor;
    vm.settings.leftSelectedTab = vm.settings.leftSelectedTab || "Nodes";
    vm.settings.rightSelectedTab = vm.settings.rightSelectedTab || "Properties";

  });


  function _event(e) {
    setTimeout(function () {
      $scope.$apply(function () {
        _activate();
      });
    }, 0);
  }

  $scope.$watch('editor.settings', function () {
    settingsModel.getSettings().then(function (settings) {
      settings.editor = vm.settings;
      settingsModel.saveSettings(settings);
    });
  }, true);

  $scope.$on('chatsimStarted', function (ev, params) {
    vm.settings.rightSelectedTab = 'chat sim';
  });

  /***
   * refresh the members 
   */
  function _activate() {
    var p = editor.project.get();
    var t = p.trees.getSelected();
    var s = t.blocks.getSelected();
    vm.blockSelected = s.length === 1;
    vm.settingsModel = settingsModel;
  }

  function _validate(block) {
    // see if has text 
    var msg = block.validate(block);
    return msg;
  }

  function _tooltip(ev) {
    var block = ev._target;
    var msg = _validate(block);
    if (msg) {
      block._tooltipOn(msg);
    }

  }

  function _tooltipOff(ev) {
    var block = ev._target;
    if (block) {
      block._tooltipOff()
    }
  }

  function _validateBlock(ev) {
    var block = ev._target;
    var msg = _validate(block);
  }

  $window.editor.on('blockdeselected', _event);
  $window.editor.on('blockremoved', _event);
  $window.editor.on('blockselected', _event);
  $window.editor.on('treeselected', _event);
  $window.editor.on('blockchanged', _event);
  $window.editor.on('tooltip', _tooltip);
  $window.editor.on('tooltip-off', _tooltipOff);
  $window.editor.on('validateblock', _validateBlock);
  _activate();

  $scope.$on('$destroy', _destroy);

  function _destroy() {
    $window.editor.off('blockselected', _event);
    $window.editor.off('blockdeselected', _event);
    $window.editor.off('blockremoved', _event);
    $window.editor.off('treeselected', _event);
    $window.editor.off('blockchanged', _event);
  }

  vm.debuggerActivated = function () {

    if (settingsModel.clientPanel && vm.settings && vm.settings.leftSelectedTab === 'Debugger') {
      settingsModel.clientPanel.showClient = true;
    }
  }
}
