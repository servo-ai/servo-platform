var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var FSMManager = require("../FSM/fsm-manager");
var processModel = require('../models/processmodel');
var config = require("../config");
var ChatDriverInterface = require("./chat-driver-interface");
var PipeManager = require("../pipes/pipemanager");
var MessageModel = require("../models/message-model");
var b3 = require('FSM/core/b3');
var apiDebug;
var fsmModel = require('models/fsmmodel');
let _id = 0;
let _inst = null;
class WebSocketDriver extends ChatDriverInterface {
  static getInst() {
    if (!_inst) {
      _inst = new WebSocketDriver();
    }
    return _inst;
  }
  protocolName() {
    return 'websocket';
  }

  /**
   * send the message
   * @param {*} response 
   * @param {*} toID 
   * @param {*} tree
   * @param {*} node 
   */
  sendMessage(response, toID, tree, node, process) {
    let creatorUserId = process.userId;
    return new Promise((resolve) => {

      // backward compat., we now use payload
      if (typeof response.payload === 'string') {
        var payload = JSON.parse(response.payload);
      } else {
        payload = response.view || response.payload || {
          text: response.text
        };
      }

      var messageObj = this.createMessageObject({
          id: config.serverBaseDomain
        }, {
          id: toID
        },
        payload.text, tree.id, payload, creatorUserId);
      messageObj.raw.isAQuestion = node.isQuestion();

      messageObj.raw.command = node.name === 'SetUIAction' ? 'ui' : 'speak';
      this.getProcessByID(messageObj, toID, undefined).then((processObj) => {
        apiDebug = require('routes/apidebug');
        apiDebug.send(processObj.id, JSON.stringify(messageObj));
      });
      resolve({
        payload: payload,
        pid: toID
      });
    });
  }

  /**
   * start apidebug which stands as a socket listener
   * @param {*} app 
   * @param {*} trees 
   */
  startAll() {
    apiDebug = require('routes/apidebug');
  }

  /**
   * when message received
   * @param {*} message 
   */
  onMessage(message) {
    console.log('websocket message arrived', message);
    //call process request
    return this.processRequest(message, {
      id: _id++
    }).then((pid) => {
      dblogger.flow('---------process request processed--------', pid, message.data);
    }).catch((error) => {
      apiDebug = require('routes/apidebug');
      _.extend(message.data, {
        text: error.toString() + error.message // not sure of the exception format
      });
      message.raw = {
        command: 'error',
        text: error.toString() + error.message
      };
      apiDebug.send(message.data.processId, message);
    });
  }

  /**
   * stop apidebug
   * @param {*} app 
   */
  stopAll(app) {
    apiDebug = require('routes/apidebug');
    apiDebug.stop(app);
  }

  /**
   * main processing 
   * @param {*} req 
   * @param {*} res 
   */
  processRequest(req, res) {
    return new Promise((resolve, reject1) => {

      var sessionObj = {};
      sessionObj.responseObj = res;
      var useNLU = req.data.useNLU;
      // take directly from message
      let fsm = fsmModel.getFSMSync(req.data.fsmId, req.data.userId);

      // messageObj must carry intentId
      if (useNLU) {

        if (!fsm) {
          return reject1('no such fsm. was the project published?');
        }
        if (fsm.properties.nlu && fsm.properties.nlu[fsm.properties.defaultLang] && fsm.properties.nlu[fsm.properties.defaultLang].engine) {
          var nlu = PipeManager.getPipe(fsm.properties.nlu[fsm.properties.defaultLang].engine, fsm.properties.nlu[fsm.properties.defaultLang]);

          nlu.process(req.data.utterance).then((nluObj) => {
            var messageObj = this.createMessageObject({
                id: config.serverBaseDomain
              }, {
                id: req.data.processId
              },
              req.data.utterance, req.data.fsmId, req.data.payload, req.data.userId);

            messageObj.intentId = nluObj.intent;
            messageObj.entities = nluObj.entities;
            messageObj.userId = req.data.userId;
            this.getCreateProcessAndMessage(messageObj, res, fsm).then((processObj) => {
              processObj.volatile("sessionObj", sessionObj);
              resolve(processObj.id);
            }).catch((err) => {
              dblogger.error("error in getCreateProcessAndMessage at " + this.protocolName(), err);
              reject1({
                message: err
              });
            });
          });
        } else {
          dblogger.error('useNLU=true but no NLU is configured in fsm.properties. you might need to set defaultLang. resorting to useNLU=false');
          useNLU = false;
        }
      }

      if (!useNLU) {
        var messageObj = this.createMessageObject({
            id: config.serverBaseDomain
          }, {
            id: req.data.processId
          },
          req.data.utterance, req.data.fsmId, req, req.data.userId);
        messageObj.entities = {};
        messageObj.intentId = req.data.intentId ||
          (req.data.payload && req.data.payload.intentId) ||
          (req.command === b3.HANDSHAKE ? b3.WAKEUP : b3.NONE);

        dblogger.flow('websocket-driver - req.data.payload-- ', req.data.payload);
        if (req.data.payload) {
          // ignore all clicks
          if (req.data.payload.event !== 'setPage' &&
            (req.data.payload.event === 'click' || req.data.payload.event === 'focusin' || req.data.payload.event === 'focusout')) {
            return resolve('ignore');
          }
          if (req.data.payload.event === 'setPage') {
            req.data.payload.entity = req.data.payload.event;
          }
          messageObj.addEntity(req.data.payload.entity, req.data.payload.value);
        }

        // in case the format is a simple object
        let intentIdFound;
        _.each(req.data.entities, (value, name) => {
          messageObj.addEntity(name, value);
          if (name.toString() === 'intentId') {
            intentIdFound = true;
          }
        }); // treat the intent specially
        if (!intentIdFound) {
          messageObj.addEntity('intentId', messageObj.intentId);
        }

        this.getCreateProcessAndMessage(messageObj, res, fsm).then((processObj) => {
          processObj.volatile("sessionObj", sessionObj);
          resolve(processObj.id);
        }).catch((err) => {
          dblogger.error("error in getCreateProcessAndMessage at " + this.protocolName(), err);
          reject1({
            message: err
          });
        });
      }
    });
  }

  /****
   * create a message user for this text and treee id
   */
  createMessageObject(recipient, sender, text, treeID, raw, creatorUserId) {
    var recipient1 = {
      id: recipient.id,
      firstName: this.protocolName() + treeID,
      lastName: '',
      channel: this.protocolName() + '-websocket'
    };
    var sender1 = {
      id: sender.id,
      firstName: 'user',
      lastName: '',
      channel: this.protocolName()
    };

    let retMsg = new MessageModel(recipient1,
      sender1,
      this.protocolName(),
      text,
      this.protocolName(),
      treeID, raw);
    retMsg.protocol = this.protocolName();
    retMsg.userId = creatorUserId;
    return retMsg;
  }
  /**
   * 
   * @param {*} messageObj 
   * @param {*} pid 
   * @param {*} res 
   */
  getProcessByID(messageObj, pid, res) {

    FSMManager = require("../FSM/fsm-manager");
    return new Promise((resolve, reject) => {
      var fsm = fsmModel.getFSMSync(messageObj.fsmId, messageObj.userId);
      // get the process
      processModel.get(pid, fsm).then((processObj) => {
        if (res) {
          var sessionObj = {};
          sessionObj.responseObj = res;
          processObj.volatile('sessionObj', sessionObj);
        }

        resolve(processObj);
      }).catch((err) => {
        // if we simply didnt find such a document
        if (err === 0) {
          dblogger.flow('create new process ' + pid);

          FSMManager.startOneProcess(fsm, messageObj, pid, {
            volatileAllData: true
          }).then((processObj) => {
            dblogger.log("process " + pid + " created");
            if (res) {
              var sessionObj = {};
              sessionObj.responseObj = res;
              processObj.volatile('sessionObj', sessionObj);
            }
            resolve(processObj);
          }).catch((err) => {
            dblogger.error('error in process.save', pid, err);
            // continue the chain.
            reject({
              process: {
                id: pid
              },
              message: messageObj,
              error: err
            });
          });
        } else {
          dblogger.error('error in getProcessByID', pid, err);
          // continue the chain.
          reject({
            process: {
              id: pid
            },
            message: messageObj,
            error: err
          });
        }
      });
    });
  }

  /**
   * for now
   * @param {*} messageObj 
   */
  getProccessID(messageObj) {
    //console.log('getProccessID')
    return messageObj.fromUser.id;
  }


  /**
   * hit the process object with the message
   * @param {*} messageObj 
   * @param {*} processObj 
   */
  actOnProcess(messageObj, processObj) {

    // log some statistics
    var lastUserTimestamp = Date.now();
    var counter = (processObj.data('lastWakeup') && processObj.data('lastWakeup').counter) || 0;
    var lastWakeup = {
      //  normalize time based on user timezone
      timestamp: lastUserTimestamp,
      // replay leaf if its not the first wakeup
      counter: counter + 1
    };
    processObj.data('lastWakeup', lastWakeup);
    processObj.volatile('replayLastLeaf', !!counter);
    processObj.data('lastUserTimestamp', lastUserTimestamp);

    return FSMManager.actOnProcess(messageObj, processObj);
  }

  /**
   * try to get individual process, if not then create it
   * resolve together with the messageObj
   * @param messageObj
   * @param res
   * @param fsm
   */
  getCreateProcessAndMessage(messageObj, res, fsm) {
    return new Promise((resolve, reject) => {
      dblogger.flow("in getCreateProcessAndMessage promise chain", messageObj.fsmId, messageObj.fromUser.id);

      var pid = this.getProccessID(messageObj);
      this.getProcessByID(messageObj, pid, res).then((processObj) => {

        var globalData = processObj.data();
        // for backwards compatibility
        let lang = null;
        if (globalData && globalData.lang) {
          lang = globalData.lang;
        } else if (fsm.properties.defaultLang) {
          processObj.data("lang", fsm.properties.defaultLang);
          lang = fsm.properties.defaultLang;
        }
        /*if (!messageObj.getEntity('setPage') &&
          (messageObj.entities.event === 'click' || messageObj.entities.event === 'focusin' || messageObj.entities.event === 'focusout')) {
          resolve(processObj); // ignore
          } else*/
        {
          //console.log('AFTER getProccessBYBYBYID')
          this.actOnProcess(messageObj, processObj).then((res) => {
            dblogger.flow('acted on process: ', processObj.summary(), res);
            resolve(processObj);
          }).catch((err) => {
            dblogger.error('error in actOnProcess for ' + pid, err);
          });
        }

      }).catch((err) => {
        reject(err);
      });
    });
  }

}
module.exports = WebSocketDriver;