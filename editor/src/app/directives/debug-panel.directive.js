(function () {
  'use strict';
  var Service = {};
  // Keep all pending requests here until they get responses
  var callbacks = {};
  // Create a unique callback ID to map requests to responses
  var currentCallbackId = 0;

  // TODO: allow more than one
  var _breakpointSet = [];

  DebugpanelController.$inject = [
    'notificationService',
    '$scope',
    '$window',
    "settingsModel",
    "debugCommService",
    "projectModel",
    "$q",
    "userService"
  ];

  var _breakpointsPost = {};
  var DEBUGGER = 'debugger';

  function DebugpanelController(notificationService, $scope,
    $window, settingsModel, debugCommService, projectModel, $q, userService) {
    var vm = this;
    vm.update = update;
    vm.keydown = keydown;
    vm.options = {
      mode: 'tree',
      modes: true
    };

    // switch immediately to the chat sim
    debugCommService.showChatsim();

    vm.debugCommService = debugCommService;
    vm.toggleView = toggleView;
    vm.run = run;
    vm.stop = stop;
    vm.step = step;
    vm.getBreakpointsMap = getBreakpointsMap;

    vm.toggleBreakpoint = toggleBreakpoint;
    var p = $window.editor.project.get();
    var t = p.trees.getSelected();
    vm.allowPreBreakpoint = allowPreBreakpoint;
    vm.allowBreakpoint = allowBreakpoint;
    vm.allowStep = allowStep;
    vm.selectedTree = getSelectedTree;
    vm.clearAllBreakpoints = clearAllBreakpoints;

    function formatDebugger(message) {
      message.protocol = DEBUGGER;
      message.fsmId = projectModel.getProject().id;
      message.processId = debugCommService.processId();
      message.userId = userService.user().id;
      return message;
    }

    /**
     * set all breakpoints user already set
     */
    function _setFSMBreakpoints() {
      var breakpoints = getBreakpointsMap();
      setTimeout(function () {
        angular.forEach(breakpoints, function (value, key) {

          setBreakpoint(projectModel.getProject().id, key, false, breakpoints[key].node);
        });

      }, 200);
    }


    function getBreakpointsMap() {
      _breakpointsPost[projectModel.getProject().id] = _breakpointsPost[projectModel.getProject().id] || {};
      return _breakpointsPost[projectModel.getProject().id];
    }

    function stop() {
      vm.running = false;
      vm.processData = undefined;
      debugCommService.send(formatDebugger({

        command: "stop",
        data: {
          "fsmId": projectModel.getProject().id,
          "processId": debugCommService.processId()
        }

      }));
      debugCommService.disconnectProtocol(DEBUGGER);

    }

    function allowStep() {
      return !vm.running && vm.processData; // only allow step after breakpoint reached
    }

    function step() {
      if ($window.editor.isDirty()) {
        notificationService.warning("Tree has changed", "You may want to publish");
      }
      vm.running = true;
      vm.processData = undefined;
      startChatsimIfNeeded();
      deselectLastBreakpoint();
      debugCommService.send(formatDebugger({

        command: "step",
        data: {
          "fsmId": projectModel.getProject().id,
          "processId": debugCommService.processId()
        }

      }));

    }

    function publishOnFirstRun() {
      return $q(function (resolve, reject) {
        if (debugCommService.protocolConnected(DEBUGGER)) {
          return resolve();
        } else {
          return projectModel
            .publishProject(true /* keep connect*/ )
            .then(function () {
              notificationService.success(
                'Project published',
                'The project has been published'
              );
              resolve();
            }, function (err) {
              console.error(err);
              notificationService.error(
                'Error',
                'Project couldn\'t be published'
              );
              reject();
            });
        }
      });
    }
    /**
     * start chatsim
     */
    function startChatsimIfNeeded() {
      // states:
      // chatsimStarting - handshaking
      // chatsimStarted (protocol connected)
      if (!debugCommService.protocolHandshaking('chatsim') && !debugCommService.protocolConnected('chatsim')) {
        debugCommService.startChatsim();
      } else {
        if (!vm.running) {
          debugCommService.sendChatsimMessage();
        }

      }
    }

    /**
     * continue or start to run
     */
    function run() {
      // error if no chatsim channel
      var pData = $window.editor.export.projectToData()
      var fsmTree = pData.trees.find(function (elem) {
        return elem.id === projectModel.getProject().id;
      });
      if (!fsmTree.properties.channels || fsmTree.properties.channels.indexOf('chatsim') < 0) {
        notificationService.error('No chatsim channel', 'Please change properties\' channels in ' + projectModel.getProject().id + ' tree to chatsim');
        return;
      }
      // warn on change
      if ($window.editor.isDirty()) {
        notificationService.warning("Tree has changed", "You may want to publish");
      }
      // always publish on first run after stop
      publishOnFirstRun().then(function () {
        startChatsimIfNeeded();
        vm.running = true;
        vm.processData = undefined;
        connect();
        deselectLastBreakpoint();
        return debugCommService.send(formatDebugger({
          command: "run",
          data: {
            "fsmId": projectModel.getProject().id,
            "processId": debugCommService.processId()
          }
        }));
      }, function () {
        stop();
      });
    }

    function attach() {
      return debugCommService.send(formatDebugger({

        command: "attach",
        data: {
          "userId": userService.user().id,
          "fsmId": projectModel.getProject().id
        }
      }));
    }

    /**
     * 
     * @param {string} bpPosition 
     */
    function clearAllBreakpoints(bpPosition) {
      var breakpoints = getBreakpointsMap();
      angular.forEach(breakpoints, function (value, key) {

        clearBreakpoint(projectModel.getProject().id, key, (bpPosition === 'pre'), breakpoints[key].node);

      });
    }


    /**
     * 
     * @param {string} bpPosition 
     */
    function toggleBreakpoint(bpPosition) {
      var breakpoints = getBreakpointsMap();

      if (breakpoints[vm.selected.id]) {
        clearBreakpoint(projectModel.getProject().id, vm.selected.id, (bpPosition === 'pre'), vm.selected);
      } else {

        setBreakpoint(projectModel.getProject().id, vm.selected.id, (bpPosition === 'pre'), vm.selected);
      }
      sendAllBreakpoints();
    }

    /**
     * 
     * @param {string} bpPosition 
     */
    function sendAllBreakpoints(bpPosition) {
      if (debugCommService.protocolConnected(DEBUGGER)) {
        var breakpoints = _breakpointsPost[projectModel.getProject().id];
        var breakpointsToSend = [];
        angular.forEach(breakpoints, function (elem, nodeId) {

          breakpointsToSend.push({
            fsmId: elem.fsmId,
            preTick: elem.preTick,
            postTick: elem.postTick,
            processId: debugCommService.processId(),
            nodeId: nodeId
          });
        });
        if (breakpointsToSend.length) {
          return debugCommService.send(formatDebugger({
            command: "setAllBreakpoints",
            data: breakpointsToSend
          }));
        }
      }
    }

    /**
     * 
     * @param {string} nodeId 
     */
    function setBreakpoint(fsmId, nodeId, preTick, node) {
      var breakpoints = getBreakpointsMap();
      breakpoints[nodeId] = {
        node: node,
        fsmId: projectModel.getProject().id,
        userId: userService.user().id,
        "preTick": preTick,
        "postTick": !preTick
      };
      node._setBreakpoint(true);
    }

    /**
     * clear a breakoint
     * @param {string} fsmId 
     * @param {string} nodeId 
     * @param {boolean} preTick 
     * @param {Object} bpNode 
     */
    function clearBreakpoint(fsmId, nodeId, bpPosition, bpNode) {
      var preTick = (bpPosition === 'pre')
      bpNode && bpNode._setBreakpoint(false);
      var breakpoints = getBreakpointsMap();
      delete breakpoints[nodeId];
      if (debugCommService.isConnected()) {
        return debugCommService.send(formatDebugger({
          command: "clearBreakpoint",
          data: {
            "preTick": preTick,
            "postTick": !preTick,
            "nodeId": nodeId,
            "fsmId": fsmId,
            "userId": userService.user().id,
          }
        }));
      } else {

        _breakpointsPost[projectModel.getProject().id] = breakpoints;

      }

    }

    function onOpen() {

    }


    function deselectLastBreakpoint() {
      vm.lastReachedBlock && vm.lastReachedBlock._reachBreakpoint(false);
    }

    function onClose() {
      $scope.$apply(function () {
        vm.running = false;
        deselectLastBreakpoint();
      });
    }

    function onMessage(bpData) {
      $scope.$apply(function () {
        if (bpData.command === 'process-is-running') {
          sendAllBreakpoints();
        } else {
          if (bpData.breakpointReached) {
            if (bpData.processId !== debugCommService.processId()) {
              console.error('bpData.processId !== debugCommService.processId()', bpData.processId, debugCommService.processId());
            }
            vm.processId = debugCommService.processId();
            vm.running = false;
            vm.processData = bpData.alldata;
            p.trees.select(bpData.treeId);
            var selectedTree = p.trees.getSelected();

            deselectLastBreakpoint();

            vm.lastReachedBlock = selectedTree.blocks.get(bpData.breakpoint.nodeId);

            selectedTree.selection.deselectAll();
            selectedTree.selection.select(vm.lastReachedBlock);
            vm.lastReachedBlock._reachBreakpoint(true);
            _activate();

          }
        }
      });

    }


    function getSelectedTree() {
      return p.trees.getSelected()._id;
    }

    function connect() {
      debugCommService.connect(DEBUGGER);
    }

    function toggleView() {
      vm.options.mode = vm.options.mode == 'tree' ? 'code' : 'tree';
      vm.properties = angular.copy(vm.properties); // force update
      vm.clientPanelSettings.mode = vm.options.mode;
      vm.update();
    }

    _create();
    _activate();
    _setFSMBreakpoints();

    $scope.$on('$destroy', _destroy);

    function _activate() {
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();
      var s = t.blocks.getSelected();

      if (s.length === 1) {
        vm.selected = s[0];

      } else {
        vm.selected = null;
      }


    }

    function allowBreakpoint() {
      return vm.selected && (vm.selected.category === 'action' || vm.selected.category === 'condition');
    }


    function allowPreBreakpoint() {
      return vm.allowPreBp && vm.allowBp;
    }

    function _event(e) {
      setTimeout(function () {
        $scope.$apply(function () {
          _activate();
        });
      }, 0);
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
      settingsModel.getSettings().then(function (settings) {
        settings.clientPanel = vm.clientPanelSettings;
        settingsModel.saveSettings(settings);
      });

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
      vm.ws && vm.ws.close();
    }
    //////////////////////////// web socket /////////////////////////
    function listener(data) {



    }

    debugCommService.register(projectModel.getProject().id, onOpen, onMessage, onClose, DEBUGGER);


  }


  angular
    .module('app')
    .directive('debugpanel', function () {
      return {
        scope: true,
        controller: DebugpanelController,
        templateUrl: 'directives/debug-panel.html',
        restrict: 'E',
        replace: false,
        bindToController: true,
        controllerAs: DEBUGGER
      };
    });


})();
