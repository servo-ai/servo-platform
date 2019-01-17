(function () {
  'use strict';
  angular
    .module('app')
    .factory('debugCommService', debugCommService);
  var _uniqueId = null;

  logService.$inject = ['$http', '$q', 'configService', 'settingsModel', '$rootScope', '$timeout', "userService", "notificationService"];

  function debugCommService($http, $q, configService, settingsModel, $rootScope, $timeout, userService, notificationService) {
    var local = {};
    var service = {
      connect: connect,
      send: send,
      disconnect: disconnect,
      isConnected: isConnected,
      startChatsim: startChatsim,
      register: register,
      setProcessId: setProcessId,
      processId: processId,
      protocolHandshaking: protocolHandshaking,
      protocolConnected: protocolConnected,
      disconnectProtocol: disconnectProtocol,
      showChatsim: showChatsim,
      sendChatsimMessage: sendChatsimMessage
    };
    return service;


    function processId() {
      _uniqueId = _uniqueId || 'dbgr-' + b3.createUUID();
      return _uniqueId;
    }
    /**
     * send the object (or push in a q until there's a connection)
     * @param {Object} message 
     */
    function send(message) {
      if (protocolConnected(message.protocol) ||
        (isConnected() && message.command === 'handshake')) {
        message.data = message.data || {};
        message.data.processId = message.data.processId || processId();
        message.data.userId = userService.user().id;
        message = JSON.stringify(message);
        console.log('comm send', message, 'state:' + local.ws.readyState);
        $timeout(function to() {
          if (!local.ws || !local.ws.readyState) {
            console.log('toto')
            $timeout(to)
          } else {
            local && local.ws && local.ws.send(message);
          }
        });

      } else {
        console.log('push to message q', message)
        local.messageQ = local.messageQ || [];
        local.messageQ.push(message);
      }

    }

    function sendMessageQ(protocol) {
      console.log('send message q')
      local.messageQ = local.messageQ || [];
      var mappedMessageQ = local.messageQ.filter((elem) => {
        if (elem.protocol === protocol) {
          console.log('send from message q', elem)
          send(elem);
          return false;
        } else {
          return true;
        }
      });
      local.messageQ = mappedMessageQ;
    }

    function isConnected() {
      return local.connected;
    }

    function protocolHandshaking(protocol) {
      return local.clients[protocol] && local.clients[protocol].handhsking;
    }

    /**
     * disconnect
     */
    function disconnect() {
      _uniqueId = null;
      if (local && local.ws) {
        local.ws.close();
      }
      local.clients = {};
    }

    /**
     * register callbacks and fsm for protocol
     * @param {*} fsmId 
     * @param {*} onOpen 
     * @param {*} onMessage 
     * @param {*} onClose 
     * @param {*} protocol 
     */
    function register(fsmId, onOpen, onMessage, onClose, protocol) {
      local.clients = local.clients || {};
      local.clients[protocol] = {
        fsmId: fsmId,
        onOpen: onOpen,
        onMessage: onMessage,
        onClose: onClose
      }
    }

    /**
     * disconnect a protocol
     * @param {*} protocol 
     */
    function disconnectProtocol(protocol) {
      local.clients[protocol].handshaking = local.clients[protocol].handshook = false;
    }

    /**
     * is protocol connected
     * @param {*} protocol 
     */
    function protocolConnected(protocol) {
      return isConnected() && local.clients[protocol] && local.clients[protocol].handshook;
    }

    function startHandshake(protocol, processId) {
      console.log('startHandshake:', protocol, processId);
      $timeout(function () {
        send({
          command: 'handshake',
          protocol: protocol,
          data: {
            processId: processId,
          }
        });
        local.clients[protocol].handshaking = true;
        local.clients[protocol].handshook = false;
      }, 100);
    }

    function endHandshake(protocol, processId) {
      var onOpen = local.clients[protocol].onOpen;
      console.log('endHandshake:', protocol, processId)
      // send Message Q
      local.clients[protocol].handshook = true;
      local.clients[protocol].handshaking = false;
      sendMessageQ(protocol);
      onOpen && onOpen();
    }

    /**
     * connect
     */
    function connect(protocol) {
      console.log('connect ', protocol)
      if (isConnected()) {
        return $q(function (resolve, reject) {
          if (!protocolConnected(protocol)) {
            startHandshake(protocol, processId());
          }
          resolve();
        });
      } else {

        return $q(function (resolve) {
          configService.getParams().then(function (params) {
            var protocol1 = 'ws://';
            var port = params.port;
            if (!configService.isLocalHost(params.serverBaseDomain) && params.openSSL) {
              protocol1 = 'wss://';
              port = 443;
            }
            local.ws = new WebSocket(protocol1 + params.serverBaseDomain + ':' + port, 'servo-protocol');

            local.ws.onopen = function () {
              console.log("Socket has been opened!" + protocol);
              local.connected = true;
              startHandshake(protocol, processId());
              resolve();
            };

            local.ws.onmessage = function (message) {
              //console.log("Received data from websocket: ", message);
              var data = JSON.parse(message.data);
              switch (data.command) {
                case 'handshake':

                  endHandshake(data.protocol, data.processId);
                  break;

                case 'error':
                  {
                    notificationService.error(data.text, "Error: have you published?");
                  }

                default:
                  {
                    var onMessage = local.clients[data.protocol].onMessage;
                    onMessage && onMessage(data);
                  }
              }


            };

            local.ws.onclose = function (message) {

              console.log("Socket closed");
              local.connected = undefined;
              //stop();
              angular.forEach(local.clients, function (client, protocol) {
                var onClose = client.onClose;
                onClose && onClose(message);
                local.clients[protocol].handshaking = false;
                local.clients[protocol].handshook = false;

              });


            };

          });
        });
      }

    }

    function setProcessId(processId) {
      local.processId = processId;
    }

    function showChatsim() {
      settingsModel.getSettings().then(function (settings) {

        settings.editor = settings.editor || {};
        settings.clientPanel = settings.clientPanel || {};
        settings.clientPanel.showClient = true;
        settings.editor.rightSelectedTab = "chat sim";
        settingsModel.saveSettings(settings);

      });
    }

    function sendChatsimMessage() {
      settingsModel.clientPanel.showClient = true;
      $rootScope.$broadcast('sendChatsimMessage');
      showChatsim();
    }


    function startChatsim() {

      settingsModel.clientPanel.showClient = true;
      $rootScope.$broadcast('chatsimStarted');
      showChatsim();

    }

  }
})();
