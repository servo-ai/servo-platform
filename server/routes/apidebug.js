var _wsServer;
var chatsim = require('chat/chatsim').getInst();
var websocketDriver = require('chat/websocket-driver').getInst();
var debugFSM = require('FSM/debug-FSM');
var WebSocketServer = require('websocket').server;
var dblogger = require('utils/dblogger');
var _ = require('underscore');
var _connections = {};
var FSMManager;

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

/**
 * for breakpoint reached
 * @param {*} bpData 
 */
function onBreakpointReached(bpData) {

  try {
    bpData.alldata.volatile = undefined;
    ApiDebug.send(bpData.processId, JSON.stringify(bpData));
  } catch (ex) {
    dblogger.error('Error in onBreakpointReached', bpData, ex);
  }

}

/**
 * for logging
 * @param {*} logData 
 */
function onClientLogger(processId, logData) {
  try {
    logData.protocol = 'console-logger';
    ApiDebug.send(processId, JSON.stringify(logData));
  } catch (ex) {
    /// must be console since dblogger has errors
    console.error('Error in onClientLogger', logData, ex);
  }
}

class ApiDebug {
  /**
   * on first message add connection
   * @param {*} pid 
   */
  static addConnection(message, connection) {

    var cid = message.data.processId;

    if (!_connections[cid]) {
      _connections[cid] = {
        connection: connection,
        send: function (msg) {
          return connection.sendUTF(msg, function (err) {
            if (err) {
              dblogger.error(err);
              // TODO: this is a patch to prevent infinite loop of error reports
              delete _connections[cid];
            }
          });
        }
      };
    }

    dblogger.log((new Date()) + ' Connection accepted from: ' + cid);
  }

  static removeConnection(connection) {
    var conn = _.each(_connections, (c, key) => {
      if (c && (c.connection === connection)) {
        _connections[key] = undefined;
        FSMManager = require('FSM/fsm-manager');
        FSMManager.tickStop(key);
        dblogger.removeClientLoggerCallback(key);
      }
    });
  }
  static start(app) {
    ApiDebug.httpServoServer = app.httpServoServer || ApiDebug.httpServoServer;
    if (_wsServer) {
      _wsServer.shutDown();
    }
    _wsServer = new WebSocketServer({
      httpServer: ApiDebug.httpServoServer,
      // You should not use autoAcceptConnections for production 
      // applications, as it defeats all standard cross-origin protection 
      // facilities built into the protocol and the browser.  You should 
      // *always* verify the connection's origin and decide whether or not 
      // to accept it. 
      autoAcceptConnections: false
    });

    // set one channel out
    debugFSM.setBreakpointReachedCallback(onBreakpointReached);

    _wsServer.on('request', function (request) {
      if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin 
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
      }

      try {
        var connection = request.accept('servo-protocol', request.origin);

        connection.on('message', function (message) {
          try {
            message = JSON.parse(message.utf8Data);
            if (!_.isObject(message.data)) {
              message.data = JSON.parse(message.data);
            }

            // if a handshake
            if (message.command === 'handshake') {
              dblogger.log(message.protocol + ' client handshake received from ' + message.data.processId);

              // add on first message
              ApiDebug.addConnection(message, connection);
              // shake back
              ApiDebug.send(message.data.processId, message);
            }

            // and route between the protocols
            switch (message.protocol) {
              // CHATSIM
              case 'chatsim':
                switch (message.command) {
                  case 'handshake':
                    // do nothing  
                    break;
                  default:
                    chatsim.onMessage(message);
                    break;
                }
                break;
              case 'websocket':
                websocketDriver.onMessage(message);
                break;

                // DEBUGGER
              case 'debugger':

                // several commands
                switch (message.command) {

                  case 'setBreakpoint':
                    debugFSM.setBreakpoint(message.data);
                    break;

                  case 'setAllBreakpoints':
                    debugFSM.setAllBreakpoints(message.fsmId, message.processId, message.data, message.userId);
                    break;

                  case 'clearBreakpoint':
                    debugFSM.clearBreakpoint(message.data);
                    break;

                  case 'run':
                    debugFSM.run(message.data).then((process1) => {
                      ApiDebug.send(message.data.processId, {
                        command: 'process-is-running',
                        protocol: 'debugger'
                      });
                    }).catch((er) => {
                      console.log(er);
                      dblogger.error(er);
                    });
                    break;

                    // case 'attach':
                    //   debugFSM.attach(message.data);
                    //   break;

                  case 'stop':
                    debugFSM.stop(message.data);
                    break;

                  case 'step':
                    debugFSM.step(message.data);
                    break;

                }
                break;

                // LOGGER
              case 'console-logger':
                dblogger.addClientLoggerCallback(message.data.processId, onClientLogger);
                break;

              default:
                throw message.protocol + " protocol not supported";
            }



          } catch (ex) {
            dblogger.error('on APIDEBUG message', ex);
          }
        });

        connection.on('close', function (reasonCode, description) {
          console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
          ApiDebug.removeConnection(connection);
        });


      } catch (ex) {
        dblogger.warn(ex)
      }


    });

  }

  static stop(app) {
    _wsServer && _wsServer.shutDown();
    ApiDebug.start(app);
  }

  /** 
   * send by process' connection
   */
  static send(pid, data) {
    var connection = _connections[pid];
    if (_.isObject(data)) {
      data = JSON.stringify(data);
    }
    if (!connection) {
      // TODO: kill this process
      dblogger.warn("no connection for process " + pid);

    }

    return connection && connection.send(data);
  }

}


module.exports = ApiDebug;