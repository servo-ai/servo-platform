(function () {
  'use strict';
  var Service = {};
  // Keep all pending requests here until they get responses
  var callbacks = {};
  // Create a unique callback ID to map requests to responses
  var currentCallbackId = 0;
  var CHATSIM = 'chatsim';


  ClientpanelController.$inject = [
    'notificationService',
    '$scope',
    '$window',
    "settingsModel",
    "debugCommService", "$timeout", 'projectModel', "$q", "userService"
  ];

  var _messages = [];

  function ClientpanelController(notificationService, $scope,
    $window, settingsModel, debugCommService, $timeout, projectModel, $q, userService) {

    var vm = this;
    vm.debugCommService = debugCommService;

    /** voice dummy connect */
    vm.connect = function () {
      return new Promise(function (resolve) {
        resolve();
      })
    };

    // servo voice
    ServoVoice.init(this);


    vm.connected = function () {
      return debugCommService.protocolConnected(CHATSIM) && debugCommService.protocolConnected('debugger');
    }


    function formatChatsim(data) {
      // force fsm id
      var fsmId = projectModel.getProject().id;
      data.fsmId = fsmId;
      data.userId = userService.user().id;
      var toSend = {
        protocol: CHATSIM,
        data: data
      }

      return toSend;
    }

    function sendStartingMessage() {
      vm.to.wakeUp = true;

      // send immediately so we get a connection with this client id
      vm.messages.push({
        time: new Date().toISOString().replace(/T/, ' ').substr(0, 19),
        text: JSON.stringify(vm.to),
        own: 'mine'
      });
      debugCommService.send(formatChatsim(vm.to));

      vm.to.wakeUp = false;
    }

    vm.update = update;
    vm.keydown = keydown;
    vm.options = {
      mode: 'code',
      modes: true
    };

    vm.clientPanelSettings = settingsModel.clientPanel || {};
    var p = $window.editor.project.get();
    var t = p.trees.getSelected();

    vm.to = {
      "useNLU": true,
      "utterance": "<(run Debugger to enable)>",
      "entities": [{
        "name": "<slot/entity name>",
        "value": "<slot/entity value>",
      }],
      "intentId": "<put intent ID>"

    };

    // set the id for this session
    debugCommService.setProcessId(debugCommService.processId());

    vm.messages = _messages;

    vm.clearMessages = function () {
      vm.messages = _messages = [];
    }
    vm.onOpen = function () {

      $scope.$apply(function () {

        sendStartingMessage();

      });
    };

    vm.onMessage = function (message) {
      listener(message);
    };

    vm.onClose = function (message) {
      $scope.$apply(function () {

      });
    };
    vm.onKeyPress = function (event) {
      if (event.charCode == 13) {
        vm.send();

      }
    }


    /**
     * connect the protocol
     */
    vm.connect = function () {

      // start a debug session
      debugCommService.connect(CHATSIM);

    }


    /**
     * sends a text to the serve
     * @param {*} message  - if comes from outside, then use this message
     */
    vm.send = function (voicemessage) {
      function pushMessages() {
        debugCommService.send(formatChatsim(vm.to));
        vm.messages.push({
          time: new Date().toISOString().replace(/T/, ' ').substr(0, 19),
          text: vm.to.utterance,
          own: 'mine'
        });

      }
      // this is coming from voice, so digest
      if (voicemessage) {
        $scope.$apply(function () {
          vm.to.utterance = voicemessage.data.utterance;
          pushMessages();
        });
      } else {
        pushMessages();
      }
      console.log('send', vm.from, vm.to);

    }

    vm.toggleView = function () {
      vm.options.mode = vm.options.mode == 'tree' ? 'code' : 'tree';
      vm.properties = angular.copy(vm.properties); // force update
      vm.clientPanelSettings.mode = vm.options.mode;
      vm.update();
    }

    _create();
    _activate();

    $scope.$on('$destroy', _destroy);

    function _activate() {
      var p = $window.editor.project.get();
      var t = p.trees.getSelected();
      var s = t.blocks.getSelected();

    }

    function _event(e) {
      setTimeout(function () {
        $scope.$apply(function () {
          _activate();
        });
      }, 0);
    }

    function _create() {
      settingsModel.getSettings().then(function (settings) {

        vm.clientPanelSettings = settings.clientPanel || {};


      });

    }

    function _destroy() {

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

    $scope.$watch('clientpanel.voice', function (ev) {
      console.log('clientpanel.voice', vm.voice)
      if (vm.voice) {
        vm.listening = true;
        ServoVoice.continue();
        vm.to.useNLU = true;
      } else {
        ServoVoice.stop();
      }
    })

    $scope.$on('chatsimStarted', function (ev, params) {

      vm.connect();

    });

    $scope.$on('sendChatsimMessage', sendStartingMessage);

    window.addEventListener('uiEvent', function (arg) {

      if (arg.detail && arg.detail.event === 'recordingStatus') {
        $scope.$apply(function () {
          vm.listening = arg.detail.value;
          console.log('listening:', vm.listening)
        });

      }

    })

    //////////////////////////// web socket /////////////////////////


    function sendRequest(request) {
      var defer = $q.defer();
      var callbackId = getCallbackId();
      callbacks[callbackId] = {
        time: new Date(),
        cb: defer
      };
      request.callback_id = callbackId;
      console.log('Sending request', request);
      ws.send(formatChatsim(request));
      return defer.promise;
    }

    function listener(data) {
      var messageObj = data;
      // If an object exists with callback_id in our callbacks object, resolve it
      if (callbacks.hasOwnProperty(messageObj.callback_id)) {
        console.log(callbacks[messageObj.callback_id]);
        $rootScope.$apply(callbacks[messageObj.callback_id].cb.resolve(messageObj.data));
        delete callbacks[messageObj.callbackID];
      }

      $scope.$apply(function () {
        vm.messages.push({
          time: new Date().toISOString().replace(/T/, ' ').substr(0, 19),
          text: messageObj.raw,
          own: 'their'
        });
      });

      ServoVoice.onMessage(messageObj);
    }
    // This creates a new callback ID for a request
    function getCallbackId() {
      currentCallbackId += 1;
      if (currentCallbackId > 10000) {
        currentCallbackId = 0;
      }
      return currentCallbackId;
    }


    debugCommService.register(projectModel.getProject().id, vm.onOpen, vm.onMessage, vm.onClose, CHATSIM);

  }



  angular
    .module('app')
    .directive('clientPanel', function () {
      return {
        scope: true,
        controller: ClientpanelController,
        templateUrl: 'directives/client-panel.html',
        restrict: 'EA',
        replace: false,
        bindToController: true,
        controllerAs: 'clientpanel'
      };
    });


})();
