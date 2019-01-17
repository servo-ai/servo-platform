var express = require('express');
var router = express.Router();
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var https = require('https');
var FSMManager = require("../FSM/fsm-manager");
var processModel = require('../models/processmodel');
var config = require("../config");
var WebSocketDriver = require("./websocket-driver");
var PipeManager = require("../pipes/pipemanager");
var MessageModel = require("../models/message-model");
var apiDebug;
var fsmModel = require('models/fsmmodel');
var _mid = 0;
let _inst = null;
class ChatsimDriver extends WebSocketDriver {
  static getInst() {
    if (!_inst) {
      _inst = new ChatsimDriver();
    }
    return _inst;
  }
  /**
   * overridable
   */
  protocolName() {
    return 'chatsim';
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
      response.isAQuestion = node.isQuestion();

      var text = response.text;
      if (!text) {
        text = "no text error!";
      }
      var messageObj = this.createMessageObject({
          id: config.serverBaseDomain
        }, {
          id: toID
        },
        text, tree.id, response, creatorUserId);

      this.getProcessByID(messageObj, toID).then((processObj) => {
        apiDebug = require('routes/apidebug');
        messageObj.protocol = 'chatsim';
        apiDebug.send(processObj.id, JSON.stringify(messageObj));
      });
      resolve({
        payload: text,
        pid: toID
      });
    });
  }

}
module.exports = ChatsimDriver;
